import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  console.log('=== DEBUGGING XP SYSTEM ===\n');
  
  // Get all users with their XP
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, first_name');
  
  console.log('=== USERS & XP ===');
  for (const p of profiles || []) {
    // Get XP for this user
    const { data: xp, error: xpError } = await supabase
      .from('user_xp_levels')
      .select('*')
      .eq('user_id', p.id)
      .single();
    
    // Get quiz results
    const { data: quizResults, count: quizCount } = await supabase
      .from('quiz_results')
      .select('id, score, completed_at', { count: 'exact' })
      .eq('user_id', p.id)
      .order('completed_at', { ascending: false })
      .limit(5);
    
    // Get badges
    const { data: badges, count: badgeCount } = await supabase
      .from('user_badges')
      .select('badge_name', { count: 'exact' })
      .eq('user_id', p.id);
    
    console.log(`\nUser: ${p.username || p.first_name || 'Unknown'}`);
    console.log(`  ID: ${p.id}`);
    console.log(`  Quizzes completed: ${quizCount || 0}`);
    if (quizResults?.length > 0) {
      console.log('  Recent quizzes:');
      quizResults.forEach(q => {
        console.log(`    - Score: ${q.score}% on ${new Date(q.completed_at).toLocaleDateString()}`);
      });
    }
    console.log(`  Badges earned: ${badgeCount || 0}`);
    if (badges?.length > 0) {
      console.log(`    Badges: ${badges.map(b => b.badge_name).join(', ')}`);
    }
    
    if (xp) {
      console.log(`  XP: ${xp.current_xp} | Level: ${xp.current_level} | Streak: ${xp.current_streak}`);
    } else {
      console.log(`  ⚠️ NO XP RECORD FOUND! Error: ${xpError?.message || 'unknown'}`);
    }
  }
  
  // Check badge definitions
  console.log('\n=== ACTIVE BADGE DEFINITIONS ===');
  const { data: badgeDefs } = await supabase
    .from('badge_definitions')
    .select('badge_key, badge_name, conditions, xp_reward, is_active')
    .eq('is_active', true);
  
  if (badgeDefs?.length > 0) {
    console.log(`Found ${badgeDefs.length} active badges:`);
    badgeDefs.forEach(b => {
      console.log(`  ${b.badge_name} (+${b.xp_reward} XP): ${JSON.stringify(b.conditions)}`);
    });
  } else {
    console.log('⚠️ NO ACTIVE BADGES FOUND!');
  }
  
  // Check quizzes
  console.log('\n=== AVAILABLE QUIZZES ===');
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, is_published')
    .eq('is_published', true);
  
  if (quizzes?.length > 0) {
    console.log(`Found ${quizzes.length} published quizzes:`);
    quizzes.forEach(q => {
      console.log(`  - ${q.title}`);
    });
  } else {
    console.log('⚠️ NO PUBLISHED QUIZZES FOUND!');
  }
}

debug().catch(console.error);

