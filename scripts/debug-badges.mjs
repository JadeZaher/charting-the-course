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

async function debugBadges() {
  console.log('=== DEBUGGING BADGE SYSTEM ===\n');
  
  // Get viewer user
  const { data: viewer } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('username', 'viewer')
    .single();
  
  if (!viewer) {
    console.log('Viewer user not found!');
    return;
  }
  
  console.log(`User: ${viewer.username} (${viewer.id})\n`);
  
  // Get user's quiz results
  const { data: results } = await supabase
    .from('quiz_results')
    .select(`
      id, score, completed_at, survey_results,
      quiz:quizzes (id, title)
    `)
    .eq('user_id', viewer.id)
    .order('completed_at', { ascending: false });
  
  console.log(`=== QUIZ RESULTS (${results?.length || 0}) ===`);
  results?.forEach(r => {
    console.log(`\nQuiz: "${r.quiz?.title}"`);
    console.log(`Score: ${r.score}%`);
    console.log(`Completed: ${r.completed_at}`);
    console.log(`Answers:`, JSON.stringify(r.survey_results, null, 2));
  });
  
  // Get all active badges with quiz_count or quiz_completion conditions
  const { data: badges } = await supabase
    .from('badge_definitions')
    .select('*')
    .eq('is_active', true);
  
  console.log(`\n=== CHECKING BADGE CONDITIONS ===`);
  
  // Get already earned badges
  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_key')
    .eq('user_id', viewer.id);
  
  const earnedKeys = new Set(earnedBadges?.map(b => b.badge_key) || []);
  console.log(`Already earned: ${earnedKeys.size} badges`);
  
  // Check each badge
  for (const badge of badges || []) {
    const condition = badge.conditions;
    if (!condition) continue;
    
    // Skip if already earned
    if (earnedKeys.has(badge.badge_key)) {
      console.log(`\n✅ ${badge.badge_name}: Already earned`);
      continue;
    }
    
    let shouldAward = false;
    let reason = '';
    
    switch (condition.type) {
      case 'quiz_count':
        const quizCount = results?.length || 0;
        const minCount = condition.min_quiz_count || 1;
        shouldAward = quizCount >= minCount;
        reason = `Quiz count: ${quizCount} >= ${minCount}? ${shouldAward}`;
        break;
        
      case 'quiz_completion':
        const quizTitle = condition.quiz_title;
        const completedQuizTitles = results?.map(r => r.quiz?.title) || [];
        shouldAward = completedQuizTitles.includes(quizTitle);
        reason = `Completed "${quizTitle}"? ${shouldAward} (completed: ${completedQuizTitles.join(', ')})`;
        break;
        
      case 'answer_match':
        // Check if any quiz result has the matching answer
        for (const result of results || []) {
          const answers = result.survey_results || {};
          const questionName = condition.question;
          const userAnswer = answers[questionName];
          
          if (userAnswer !== undefined) {
            if (condition.value !== undefined) {
              shouldAward = String(userAnswer).toLowerCase() === String(condition.value).toLowerCase();
            } else if (condition.values) {
              shouldAward = condition.values.some(v => 
                String(userAnswer).toLowerCase() === String(v).toLowerCase()
              );
            } else if (condition.min_value !== undefined) {
              shouldAward = Number(userAnswer) >= condition.min_value;
            }
            
            if (shouldAward) {
              reason = `Question "${questionName}" = "${userAnswer}" matches condition`;
              break;
            }
          }
        }
        if (!shouldAward) {
          reason = `No matching answer for question "${condition.question}"`;
        }
        break;
        
      default:
        reason = `Unknown condition type: ${condition.type}`;
    }
    
    if (shouldAward) {
      console.log(`\n🏆 ${badge.badge_name}: SHOULD BE AWARDED!`);
      console.log(`   Reason: ${reason}`);
      console.log(`   XP Reward: ${badge.xp_reward}`);
    } else if (condition.type === 'quiz_count' || condition.type === 'quiz_completion') {
      console.log(`\n❌ ${badge.badge_name}: Not earned`);
      console.log(`   Reason: ${reason}`);
    }
  }
  
  // Now let's manually award the quiz_count badges that should be earned
  console.log('\n=== MANUALLY AWARDING MISSING BADGES ===');
  
  const badgesToAward = [];
  const awardedKeys = new Set(); // Prevent duplicates
  
  for (const badge of badges || []) {
    if (earnedKeys.has(badge.badge_key)) continue;
    if (awardedKeys.has(badge.badge_key)) continue;
    
    const condition = badge.conditions;
    if (!condition) continue;
    
    let shouldAward = false;
    
    if (condition.type === 'quiz_count') {
      const quizCount = results?.length || 0;
      shouldAward = quizCount >= (condition.min_quiz_count || 1);
    }
    
    if (condition.type === 'quiz_completion') {
      const completedTitles = results?.map(r => r.quiz?.title) || [];
      shouldAward = completedTitles.includes(condition.quiz_title);
    }
    
    if (condition.type === 'answer_match') {
      for (const result of results || []) {
        const answers = result.survey_results || {};
        const questionName = condition.question;
        const userAnswer = answers[questionName];
        
        if (userAnswer !== undefined) {
          if (condition.value !== undefined) {
            shouldAward = String(userAnswer).toLowerCase() === String(condition.value).toLowerCase();
          } else if (condition.values) {
            shouldAward = condition.values.some(v => 
              String(userAnswer).toLowerCase() === String(v).toLowerCase()
            );
          } else if (condition.min_value !== undefined) {
            shouldAward = Number(userAnswer) >= condition.min_value;
          }
          if (shouldAward) break;
        }
      }
    }
    
    if (shouldAward) {
      badgesToAward.push(badge);
      awardedKeys.add(badge.badge_key);
    }
  }
  
  if (badgesToAward.length > 0) {
    console.log(`\nAwarding ${badgesToAward.length} badges...`);
    
    for (const badge of badgesToAward) {
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: viewer.id,
          badge_key: badge.badge_key,
          badge_name: badge.badge_name,
          badge_description: badge.badge_description,
          badge_icon: badge.badge_icon,
          badge_category: badge.badge_category,
          earned_at: new Date().toISOString(),
          strength: 1,
        });
      
      if (error) {
        console.log(`  ❌ Failed to award "${badge.badge_name}": ${error.message}`);
      } else {
        console.log(`  ✅ Awarded "${badge.badge_name}" (+${badge.xp_reward} XP)`);
        
        // Update XP
        const { data: currentXP } = await supabase
          .from('user_xp_levels')
          .select('total_xp')
          .eq('user_id', viewer.id)
          .single();
        
        if (currentXP) {
          await supabase
            .from('user_xp_levels')
            .update({ 
              total_xp: (currentXP.total_xp || 0) + badge.xp_reward,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', viewer.id);
        }
      }
    }
  } else {
    console.log('No badges to award based on current quiz results.');
  }
}

debugBadges().catch(console.error);

