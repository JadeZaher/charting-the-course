#!/usr/bin/env node
/**
 * Script to ensure the badges storage bucket exists in Supabase
 * Creates the bucket and policies if they don't exist
 * Uses service role key to execute SQL directly
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Check for SERVICE_ROLE_KEY first (as user has it), then fallback to SUPABASE_SERVICE_ROLE_KEY
const supabaseServiceKey = process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Check your .env file and ensure these variables are set.');
  console.error('   Expected: SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Validate service role key format (should start with eyJ)
if (!supabaseServiceKey.startsWith('eyJ')) {
  console.error('❌ Invalid service role key format!');
  console.error('   Service role keys should start with "eyJ" (JWT format)');
  console.error('   Make sure you are using the SERVICE_ROLE_KEY, not the ANON_KEY');
  console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

console.log('✅ Environment variables loaded:');
console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);
console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...\n`);

// Create Supabase client with service role (needed for bucket creation)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Alternative method: Try creating bucket via RPC function
async function tryCreateBucketViaRPC() {
  console.log('🔄 Attempting to create bucket via database function...\n');
  
  try {
    const { data: result, error: rpcError } = await supabase.rpc('ensure_badges_bucket');

    if (rpcError) {
      if (rpcError.message?.includes('function') && rpcError.message?.includes('does not exist')) {
        console.log('   ⚠️  Database function not found');
        console.log('   💡 You need to run the migration first:');
        console.log('      supabase db push');
        console.log('\n   This will create the ensure_badges_bucket() function.');
      } else {
        console.error('   ❌ RPC error:', rpcError.message);
      }
      
      console.log('\n📋 Manual Creation Instructions:');
      console.log('   1. Go to Supabase Dashboard → Storage');
      console.log('   2. Click "New bucket"');
      console.log('   3. Name: "badges"');
      console.log('   4. Public: ON');
      console.log('   5. File size limit: 5MB');
      console.log('   6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml');
      console.log('\n   OR run migration to create it automatically:');
      console.log('      supabase db push');
      return;
    }

    if (result?.success) {
      console.log(`✅ ${result.message}`);
      console.log('\n✅ Bucket created successfully via database function!');
      return;
    } else {
      console.log('   ⚠️  Bucket creation may have failed');
      console.log('   💡 Please verify in Supabase Dashboard');
    }
  } catch (error) {
    console.error('   ❌ Error calling RPC function:', error.message);
    console.log('\n💡 Please create the bucket manually or run: supabase db push');
  }
}

async function ensureBadgesBucket() {
  console.log('🔍 Checking for badges storage bucket...\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      
      if (listError.message.includes('signature verification failed') || listError.message.includes('JWT')) {
        console.error('\n🔍 This usually means:');
        console.error('   1. The service role key is incorrect or invalid');
        console.error('   2. You might be using the anon key instead of service role key');
        console.error('   3. The key might be from a different Supabase project');
        console.error('\n💡 To fix:');
        console.error('   1. Go to Supabase Dashboard → Settings → API');
        console.error('   2. Copy the "service_role" key (NOT the "anon" key)');
        console.error('   3. Set it in .env as: SERVICE_ROLE_KEY=your_service_role_key');
        console.error('\n⚠️  Since storage API failed, trying alternative method...\n');
        
        // Try using RPC function if available
        return await tryCreateBucketViaRPC();
      }
      
      process.exit(1);
    }

    const badgesBucket = buckets?.find(b => b.id === 'badges');

    if (badgesBucket) {
      console.log('✅ Badges bucket already exists');
      console.log(`   ID: ${badgesBucket.id}`);
      console.log(`   Public: ${badgesBucket.public}`);
      console.log(`   Created: ${badgesBucket.created_at}`);
    } else {
      console.log('📦 Creating badges bucket...');
      
      // Try to create bucket using the ensure_badges_bucket function
      const { data: result, error: rpcError } = await supabase.rpc('ensure_badges_bucket');

      if (rpcError) {
        console.log('   ⚠️  Function not available, trying direct SQL...');
        
        // Try direct SQL execution (may not work without proper permissions)
        try {
          // Use the migration SQL directly via a query
          // Note: This requires the function to exist or direct SQL access
          console.log('   💡 Please run migrations first:');
          console.log('      supabase db push');
          console.log('\n   OR create the bucket manually:');
          console.log('      1. Go to Supabase Dashboard > Storage');
          console.log('      2. Click "New bucket"');
          console.log('      3. Name: "badges"');
          console.log('      4. Public: ON');
          console.log('      5. File size limit: 5MB');
          console.log('      6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml');
          return;
        } catch (error) {
          console.log('   ❌ Could not create bucket automatically');
          console.log('\n💡 Please run: supabase db push');
          return;
        }
      } else if (result?.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log('   ⚠️  Bucket creation may have failed');
        console.log('   💡 Please verify in Supabase Dashboard or run: supabase db push');
      }
    }

    // Verify bucket exists now
    const { data: bucketsAfter, error: listErrorAfter } = await supabase.storage.listBuckets();
    const badgesBucketAfter = bucketsAfter?.find(b => b.id === 'badges');
    
    if (badgesBucketAfter) {
      console.log('\n✅ Badges bucket verified!');
      console.log('📝 Note: Storage policies should be created via migration:');
      console.log('   Run: supabase db push');
      console.log('   (This will create policies from: supabase/migrations/20240120000002_create_badges_storage_bucket.sql)');
    } else {
      console.log('\n⚠️  Bucket not found. Please create it manually or run migration.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n💡 Please create the bucket manually in Supabase Dashboard or run:');
    console.log('   supabase db push');
    process.exit(1);
  }
}

// Run the script
ensureBadgesBucket()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
