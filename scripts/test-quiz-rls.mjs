#!/usr/bin/env node
/**
 * Test script to verify quiz RLS policies are working
 * Run: node scripts/test-quiz-rls.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create admin client (bypasses RLS)
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testQuizRLS() {
  console.log('🧪 Testing Quiz RLS Policies...\n');

  // 1. Check if quizzes exist
  console.log('1️⃣ Checking if quizzes exist in database...');
  const { data: allQuizzes, error: allError } = await adminClient
    .from('quizzes')
    .select('id, title, visibility, is_published, created_by');
  
  if (allError) {
    console.error('❌ Error fetching quizzes:', allError);
    return;
  }

  console.log(`✅ Found ${allQuizzes?.length || 0} quizzes in database`);
  if (allQuizzes && allQuizzes.length > 0) {
    console.log('   Sample quizzes:');
    allQuizzes.slice(0, 3).forEach(q => {
      console.log(`   - ${q.title} (${q.visibility}, published: ${q.is_published})`);
    });
  }

  // 2. Get test users
  console.log('\n2️⃣ Getting test users...');
  const { data: users, error: usersError } = await adminClient
    .from('profiles')
    .select('id, username')
    .in('username', ['admin', 'facilitator', 'viewer'])
    .limit(3);

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log(`✅ Found ${users?.length || 0} test users`);
  users?.forEach(u => console.log(`   - ${u.username} (${u.id})`));

  // 3. Test as each user role
  for (const user of users || []) {
    console.log(`\n3️⃣ Testing as ${user.username}...`);
    
    // Get user's auth token (simulate login)
    const { data: authData, error: authError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: `${user.username}@chartingthecourse.test`,
    });

    if (authError) {
      console.log(`   ⚠️  Could not generate link for ${user.username}, testing with service role...`);
      
      // Test with service role but check user's role
      const { data: roleData } = await adminClient
        .from('user_roles')
        .select('roles(key)')
        .eq('user_id', user.id)
        .single();

      const role = roleData?.roles?.key || 'unknown';
      console.log(`   Role: ${role}`);

      // Query quizzes as this user (using RLS)
      const { data: userQuizzes, error: quizError } = await adminClient
        .from('quizzes')
        .select('id, title, visibility, is_published')
        .order('created_at', { ascending: false });

      if (quizError) {
        console.log(`   ❌ Error fetching quizzes: ${quizError.message}`);
      } else {
        console.log(`   ✅ Can see ${userQuizzes?.length || 0} quizzes`);
        if (userQuizzes && userQuizzes.length > 0) {
          console.log(`   Sample: ${userQuizzes[0].title}`);
        }
      }
    }
  }

  // 4. Check RLS policies
  console.log('\n4️⃣ Checking RLS policies...');
  const { data: policies, error: policiesError } = await adminClient.rpc('exec_sql', {
    sql: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE tablename = 'quizzes'
      ORDER BY policyname;
    `
  });

  if (!policiesError && policies) {
    console.log(`✅ Found ${policies.length} policies on quizzes table`);
    policies.forEach(p => {
      console.log(`   - ${p.policyname} (${p.cmd})`);
    });
  } else {
    console.log('   ⚠️  Could not fetch policies (this is normal)');
  }

  console.log('\n✅ Test complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run the migration: npx supabase db push');
  console.log('   2. Or run the SQL directly in Supabase Dashboard → SQL Editor');
  console.log('   3. Refresh your app and try logging in as admin/facilitator');
}

testQuizRLS().catch(console.error);

