#!/usr/bin/env node

/**
 * Seed script for Supabase database
 * 
 * Usage: npm run db:seed:only
 * 
 * This script creates test users using the Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('📦 Loaded environment from .env');
} else {
  const envLocalPath = join(__dirname, '..', '.env.local');
  if (existsSync(envLocalPath)) {
    config({ path: envLocalPath });
    console.log('📦 Loaded environment from .env.local');
  }
}

// Get environment variables
const supabaseUrl = 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL;

const supabaseServiceKey = 
  process.env.SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing Supabase URL!');
  console.error('Set VITE_SUPABASE_URL or SUPABASE_URL in your .env file');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY!');
  console.error('Get it from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test users to create
const testUsers = [
  {
    email: 'admin@chartingthecourse.test',
    password: 'TestPassword123!',
    role: 'admin',
    profile: {
      first_name: 'Admin',
      last_name: 'User',
      username: 'admin',
      bio: 'Platform administrator with full system access.',
      headline: 'Platform Administrator • System Manager',
      profile_visibility: 'public',
      share_slug: 'admin',
      profile_tags: ['admin', 'management', 'leadership'],
      social_links: { website: 'https://chartingthecourse.com' },
    },
    xp: { total_xp: 500, current_level: 3, xp_to_next_level: 100, quiz_streak: 5, longest_streak: 10 },
  },
  {
    email: 'facilitator@chartingthecourse.test',
    password: 'TestPassword123!',
    role: 'facilitator',
    profile: {
      first_name: 'Facilitator',
      last_name: 'User',
      username: 'facilitator',
      bio: 'Quiz facilitator creating engaging learning experiences.',
      headline: 'Learning Facilitator • Quiz Designer',
      profile_visibility: 'public',
      share_slug: 'facilitator',
      profile_tags: ['education', 'facilitation', 'design'],
      social_links: { linkedin: 'https://linkedin.com/in/facilitator' },
    },
    xp: { total_xp: 250, current_level: 2, xp_to_next_level: 50, quiz_streak: 3, longest_streak: 5 },
  },
  {
    email: 'viewer@chartingthecourse.test',
    password: 'TestPassword123!',
    role: 'viewer',
    profile: {
      first_name: 'Viewer',
      last_name: 'User',
      username: 'viewer',
      bio: 'Exploring quizzes and building my profile.',
      headline: 'Learner • Explorer',
      profile_visibility: 'private',
      share_slug: 'viewer',
      profile_tags: ['learning', 'growth'],
      social_links: {},
    },
    xp: { total_xp: 50, current_level: 1, xp_to_next_level: 50, quiz_streak: 1, longest_streak: 1 },
  },
];

async function deleteExistingTestUsers() {
  console.log('\n🧹 Cleaning up existing test users...');
  
  try {
    // List all users
    const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log(`   ⚠️ Could not list users: ${listError.message}`);
      return;
    }

    // Find and delete test users
    const testEmails = testUsers.map(u => u.email);
    const usersToDelete = allUsers?.users?.filter(u => testEmails.includes(u.email)) || [];

    for (const user of usersToDelete) {
      console.log(`   🗑️ Deleting ${user.email}...`);
      
      // Delete from related tables first (cascade should handle this, but just in case)
      await supabase.from('user_achievements').delete().eq('user_id', user.id);
      await supabase.from('user_badges').delete().eq('user_id', user.id);
      await supabase.from('user_xp_levels').delete().eq('user_id', user.id);
      await supabase.from('user_privacy_settings').delete().eq('user_id', user.id);
      await supabase.from('user_roles').delete().eq('user_id', user.id);
      await supabase.from('profile_share_links').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('id', user.id);
      
      // Delete auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.log(`   ⚠️ Failed to delete ${user.email}: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Deleted ${user.email}`);
      }
    }

    if (usersToDelete.length === 0) {
      console.log('   ℹ️ No existing test users found');
    }
  } catch (error) {
    console.log(`   ⚠️ Cleanup error: ${error.message}`);
  }
}

async function createUser(userData) {
  const { email, password, role, profile, xp } = userData;
  
  console.log(`\n👤 Creating ${role}: ${email}`);
  
  try {
    // Create user via Admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: profile.first_name,
        last_name: profile.last_name,
      },
    });

    if (authError) {
      console.error(`   ❌ Failed to create auth user:`, authError.message);
      return false;
    }
    
    const userId = authData.user.id;
    console.log(`   ✅ Auth user created: ${userId}`);

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profile,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error(`   ❌ Failed to update profile:`, profileError.message);
    } else {
      console.log(`   ✅ Profile updated`);
    }

    // Get role ID and assign role
    const { data: roleData, error: roleLookupError } = await supabase
      .from('roles')
      .select('id, key, name')
      .eq('key', role)
      .single();

    if (roleLookupError) {
      console.error(`   ❌ Failed to find role '${role}':`, roleLookupError.message);
    } else if (roleData) {
      console.log(`   📌 Found role: ${roleData.name} (id: ${roleData.id})`);
      
      // First, delete any existing role assignment (to avoid conflicts)
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      // Then insert the correct role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role_id: roleData.id,
          assigned_at: new Date().toISOString(),
        });

      if (roleError) {
        console.error(`   ❌ Failed to assign role:`, roleError.message);
        
        // Try update instead
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role_id: roleData.id, assigned_at: new Date().toISOString() })
          .eq('user_id', userId);
          
        if (updateError) {
          console.error(`   ❌ Update also failed:`, updateError.message);
        } else {
          console.log(`   ✅ Role updated: ${role}`);
        }
      } else {
        console.log(`   ✅ Role assigned: ${role}`);
      }
      
      // Verify the role was set
      const { data: verifyRole } = await supabase
        .from('user_roles')
        .select('role_id, roles(key, name)')
        .eq('user_id', userId)
        .single();
      
      if (verifyRole) {
        console.log(`   🔍 Verified role: ${verifyRole.roles?.name || 'Unknown'}`);
      }
    } else {
      console.error(`   ❌ Role '${role}' not found in database!`);
    }

    // Create/update XP levels
    const { error: xpError } = await supabase
      .from('user_xp_levels')
      .upsert({
        user_id: userId,
        ...xp,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (xpError) {
      console.error(`   ❌ Failed to set XP:`, xpError.message);
    } else {
      console.log(`   ✅ XP initialized: Level ${xp.current_level}`);
    }

    // Create privacy settings
    const { error: privacyError } = await supabase
      .from('user_privacy_settings')
      .upsert({
        user_id: userId,
        is_profile_public: profile.profile_visibility === 'public',
        show_badges: true,
        show_quiz_results: role === 'admin',
        show_tags: true,
        allow_discovery: profile.profile_visibility === 'public',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (privacyError) {
      console.error(`   ❌ Failed to set privacy:`, privacyError.message);
    } else {
      console.log(`   ✅ Privacy settings configured`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error creating user:`, error.message);
    return false;
  }
}

// Sample quizzes with SurveyJS format
const sampleQuizzes = [
  // Contact & Communication Profile Quiz
  {
    title: 'Contact & Communication Profile Quiz',
    description: 'Help us understand how you prefer to be contacted and what communication modes energize or drain you. This quiz builds your communication profile with tags version 1.0.',
    visibility: 'public',
    mode: 'take',
    is_published: true,
    survey_json: {
      title: 'Contact & Communication Profile',
      description: 'Discover your communication style and preferences',
      showProgressBar: 'top',
      progressBarType: 'pages',
      pages: [
        {
          name: 'preferred_channels',
          title: 'Preferred Communication Channels',
          elements: [
            {
              type: 'ranking',
              name: 'channel_preference',
              title: 'Rank your preferred communication channels (drag to reorder, most preferred at top):',
              choices: [
                { value: 'email', text: '📧 Email' },
                { value: 'video_call', text: '📹 Video Call (Zoom, Teams)' },
                { value: 'phone', text: '📞 Phone Call' },
                { value: 'instant_message', text: '💬 Instant Message (Slack, Teams chat)' },
                { value: 'in_person', text: '🤝 In-Person Meeting' },
                { value: 'text_sms', text: '📱 Text/SMS' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'response_time',
              title: 'What is your typical response time expectation for non-urgent messages?',
              choices: [
                { value: 'immediate', text: 'Within minutes' },
                { value: 'few_hours', text: 'Within a few hours' },
                { value: 'same_day', text: 'Same day' },
                { value: 'next_day', text: 'Within 24-48 hours' },
                { value: 'flexible', text: 'Flexible - depends on the topic' }
              ],
              isRequired: true
            }
          ]
        },
        {
          name: 'communication_style',
          title: 'Communication Style',
          elements: [
            {
              type: 'radiogroup',
              name: 'meeting_preference',
              title: 'When it comes to meetings, I prefer:',
              choices: [
                { value: 'scheduled', text: 'Scheduled with agenda in advance' },
                { value: 'spontaneous', text: 'Quick, spontaneous check-ins' },
                { value: 'async', text: 'Asynchronous updates (written)' },
                { value: 'minimal', text: 'As few meetings as possible' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'feedback_style',
              title: 'How do you prefer to receive feedback?',
              choices: [
                { value: 'direct', text: 'Direct and to the point' },
                { value: 'supportive', text: 'Supportive with context' },
                { value: 'written', text: 'In writing so I can process it' },
                { value: 'private', text: 'Privately, one-on-one' }
              ],
              isRequired: true
            },
            {
              type: 'checkbox',
              name: 'communication_energizers',
              title: 'Which communication activities energize you? (Select all that apply)',
              choices: [
                { value: 'brainstorming', text: 'Group brainstorming sessions' },
                { value: 'presenting', text: 'Presenting to groups' },
                { value: 'one_on_one', text: 'One-on-one conversations' },
                { value: 'writing', text: 'Writing detailed documentation' },
                { value: 'teaching', text: 'Teaching or mentoring others' },
                { value: 'listening', text: 'Active listening in discussions' }
              ],
              isRequired: true
            }
          ]
        },
        {
          name: 'boundaries',
          title: 'Communication Boundaries',
          elements: [
            {
              type: 'radiogroup',
              name: 'after_hours',
              title: 'How do you feel about after-hours communication?',
              choices: [
                { value: 'available', text: 'I\'m generally available' },
                { value: 'urgent_only', text: 'Only for urgent matters' },
                { value: 'prefer_not', text: 'Prefer not to be contacted' },
                { value: 'set_hours', text: 'I have specific availability windows' }
              ],
              isRequired: true
            },
            {
              type: 'rating',
              name: 'video_comfort',
              title: 'How comfortable are you with video calls?',
              rateMin: 1,
              rateMax: 5,
              minRateDescription: 'Prefer audio only',
              maxRateDescription: 'Love video calls',
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'conflict_communication',
              title: 'When addressing conflicts, I prefer to:',
              choices: [
                { value: 'face_to_face', text: 'Discuss face-to-face or via video' },
                { value: 'voice', text: 'Talk it through on a call' },
                { value: 'writing', text: 'Write out my thoughts first' },
                { value: 'mediator', text: 'Have a mediator present' }
              ],
              isRequired: true
            }
          ]
        }
      ]
    }
  },
  // Locations & Travel Profile Quiz
  {
    title: 'Locations & Travel Profile Quiz',
    description: 'Help us understand your global experience, travel preferences, and privacy boundaries around location and identity. This quiz builds your location profile with tags version 1.0.',
    visibility: 'public',
    mode: 'take',
    is_published: true,
    survey_json: {
      title: 'Locations & Travel Profile',
      description: 'Share your travel experiences and location preferences',
      showProgressBar: 'top',
      progressBarType: 'pages',
      pages: [
        {
          name: 'current_location',
          title: 'Your Location',
          elements: [
            {
              type: 'radiogroup',
              name: 'work_style',
              title: 'What best describes your current work arrangement?',
              choices: [
                { value: 'office', text: '🏢 Primarily office-based' },
                { value: 'remote', text: '🏠 Fully remote' },
                { value: 'hybrid', text: '🔄 Hybrid (mix of office and remote)' },
                { value: 'nomad', text: '🌍 Digital nomad / traveling' },
                { value: 'field', text: '🚗 Field-based / on-site client work' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'timezone_flexibility',
              title: 'How flexible are you with meeting times across time zones?',
              choices: [
                { value: 'very_flexible', text: 'Very flexible - can accommodate most time zones' },
                { value: 'somewhat', text: 'Somewhat flexible - within reason' },
                { value: 'limited', text: 'Limited - prefer my business hours' },
                { value: 'strict', text: 'Strict - only during my set hours' }
              ],
              isRequired: true
            }
          ]
        },
        {
          name: 'travel_experience',
          title: 'Travel Experience',
          elements: [
            {
              type: 'radiogroup',
              name: 'countries_visited',
              title: 'Approximately how many countries have you visited?',
              choices: [
                { value: '1-5', text: '1-5 countries' },
                { value: '6-15', text: '6-15 countries' },
                { value: '16-30', text: '16-30 countries' },
                { value: '31-50', text: '31-50 countries' },
                { value: '50+', text: 'More than 50 countries' }
              ],
              isRequired: true
            },
            {
              type: 'checkbox',
              name: 'regions_experienced',
              title: 'Which regions have you lived in or visited extensively? (Select all that apply)',
              choices: [
                { value: 'north_america', text: '🌎 North America' },
                { value: 'south_america', text: '🌎 South America' },
                { value: 'europe', text: '🌍 Europe' },
                { value: 'africa', text: '🌍 Africa' },
                { value: 'middle_east', text: '🌍 Middle East' },
                { value: 'asia', text: '🌏 Asia' },
                { value: 'oceania', text: '🌏 Oceania / Australia' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'languages',
              title: 'How many languages do you speak conversationally?',
              choices: [
                { value: '1', text: '1 language' },
                { value: '2', text: '2 languages' },
                { value: '3', text: '3 languages' },
                { value: '4+', text: '4 or more languages' }
              ],
              isRequired: true
            }
          ]
        },
        {
          name: 'travel_preferences',
          title: 'Travel Preferences',
          elements: [
            {
              type: 'radiogroup',
              name: 'travel_frequency',
              title: 'How often do you typically travel for work or pleasure?',
              choices: [
                { value: 'rarely', text: 'Rarely (0-1 times per year)' },
                { value: 'occasionally', text: 'Occasionally (2-4 times per year)' },
                { value: 'regularly', text: 'Regularly (5-10 times per year)' },
                { value: 'frequently', text: 'Frequently (monthly or more)' },
                { value: 'constantly', text: 'Constantly (always on the move)' }
              ],
              isRequired: true
            },
            {
              type: 'checkbox',
              name: 'travel_motivations',
              title: 'What motivates your travel? (Select all that apply)',
              choices: [
                { value: 'business', text: '💼 Business meetings/conferences' },
                { value: 'culture', text: '🏛️ Cultural exploration' },
                { value: 'adventure', text: '🏔️ Adventure and outdoor activities' },
                { value: 'relaxation', text: '🏖️ Relaxation and wellness' },
                { value: 'family', text: '👨‍👩‍👧 Visiting family/friends' },
                { value: 'remote_work', text: '💻 Remote work from new places' }
              ],
              isRequired: true
            },
            {
              type: 'rating',
              name: 'adventure_level',
              title: 'How adventurous are you when traveling?',
              rateMin: 1,
              rateMax: 5,
              minRateDescription: 'Prefer comfort & familiarity',
              maxRateDescription: 'Love exploring the unknown',
              isRequired: true
            }
          ]
        },
        {
          name: 'location_privacy',
          title: 'Location Privacy',
          elements: [
            {
              type: 'radiogroup',
              name: 'location_sharing',
              title: 'How comfortable are you sharing your general location?',
              choices: [
                { value: 'public', text: 'Public - anyone can see my location' },
                { value: 'team', text: 'Team only - colleagues can see' },
                { value: 'timezone', text: 'Timezone only - no specific location' },
                { value: 'private', text: 'Private - prefer not to share' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'cultural_interests',
              title: 'What aspect of other cultures interests you most?',
              choices: [
                { value: 'food', text: '🍜 Food and cuisine' },
                { value: 'history', text: '📜 History and traditions' },
                { value: 'people', text: '👥 Meeting local people' },
                { value: 'nature', text: '🌿 Nature and landscapes' },
                { value: 'arts', text: '🎨 Arts and entertainment' }
              ],
              isRequired: true
            }
          ]
        }
      ]
    }
  },
  // Collaboration Style Assessment
  {
    title: 'Collaboration Style Assessment',
    description: 'Discover your natural collaboration style and how you work best with others. Learn about your teamwork preferences and get matched with complementary collaborators.',
    visibility: 'public',
    mode: 'take',
    is_published: true,
    survey_json: {
      title: 'Collaboration Style Assessment',
      description: 'Understand how you collaborate with others',
      showProgressBar: 'top',
      progressBarType: 'pages',
      pages: [
        {
          name: 'teamwork_style',
          title: 'Teamwork Style',
          elements: [
            {
              type: 'radiogroup',
              name: 'team_role',
              title: 'In a team project, you naturally tend to:',
              choices: [
                { value: 'leader', text: '👑 Take charge and coordinate the team' },
                { value: 'innovator', text: '💡 Generate creative ideas and solutions' },
                { value: 'executor', text: '⚡ Focus on getting things done efficiently' },
                { value: 'harmonizer', text: '🤝 Ensure everyone is heard and aligned' },
                { value: 'analyst', text: '🔍 Analyze details and prevent mistakes' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'decision_making',
              title: 'When making group decisions, you prefer:',
              choices: [
                { value: 'consensus', text: 'Building consensus - everyone agrees' },
                { value: 'majority', text: 'Majority vote - most people agree' },
                { value: 'expert', text: 'Expert decision - most knowledgeable decides' },
                { value: 'leader', text: 'Leader decision - one person accountable' }
              ],
              isRequired: true
            },
            {
              type: 'rating',
              name: 'collaboration_preference',
              title: 'How much do you enjoy collaborative work vs. independent work?',
              rateMin: 1,
              rateMax: 5,
              minRateDescription: 'Strongly prefer independent',
              maxRateDescription: 'Strongly prefer collaborative',
              isRequired: true
            }
          ]
        },
        {
          name: 'communication_in_teams',
          title: 'Team Communication',
          elements: [
            {
              type: 'radiogroup',
              name: 'idea_sharing',
              title: 'When sharing ideas in a group, you typically:',
              choices: [
                { value: 'first', text: 'Speak up first to set direction' },
                { value: 'build', text: 'Build on others\' ideas' },
                { value: 'wait', text: 'Wait and share well-formed thoughts' },
                { value: 'written', text: 'Prefer to share in writing' }
              ],
              isRequired: true
            },
            {
              type: 'checkbox',
              name: 'team_strengths',
              title: 'What do you bring to a team? (Select your top 3)',
              choices: [
                { value: 'creativity', text: '🎨 Creativity and innovation' },
                { value: 'organization', text: '📋 Organization and planning' },
                { value: 'motivation', text: '🔥 Energy and motivation' },
                { value: 'expertise', text: '🧠 Technical expertise' },
                { value: 'diplomacy', text: '🕊️ Diplomacy and conflict resolution' },
                { value: 'reliability', text: '⏰ Reliability and follow-through' }
              ],
              isRequired: true,
              maxSelectedChoices: 3
            }
          ]
        },
        {
          name: 'work_environment',
          title: 'Ideal Work Environment',
          elements: [
            {
              type: 'radiogroup',
              name: 'pace_preference',
              title: 'What pace of work do you thrive in?',
              choices: [
                { value: 'fast', text: '🚀 Fast-paced with quick iterations' },
                { value: 'steady', text: '⚖️ Steady with clear milestones' },
                { value: 'flexible', text: '🌊 Flexible based on project needs' },
                { value: 'deep', text: '🧘 Slow and deliberate for quality' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'feedback_frequency',
              title: 'How often do you like to sync with collaborators?',
              choices: [
                { value: 'daily', text: 'Daily check-ins' },
                { value: 'weekly', text: 'Weekly updates' },
                { value: 'milestone', text: 'At project milestones' },
                { value: 'as_needed', text: 'As needed basis' }
              ],
              isRequired: true
            }
          ]
        }
      ]
    }
  },
  // Work Values & Motivation Quiz
  {
    title: 'Work Values & Motivation Quiz',
    description: 'Understand what drives you at work and discover your core professional values. This quiz helps match you with like-minded collaborators and meaningful projects.',
    visibility: 'public',
    mode: 'take',
    is_published: true,
    survey_json: {
      title: 'Work Values & Motivation',
      description: 'Discover what drives your professional life',
      showProgressBar: 'top',
      progressBarType: 'pages',
      pages: [
        {
          name: 'core_values',
          title: 'Core Work Values',
          elements: [
            {
              type: 'ranking',
              name: 'value_ranking',
              title: 'Rank these work values in order of importance to you:',
              choices: [
                { value: 'impact', text: '🌍 Making a positive impact' },
                { value: 'growth', text: '📈 Personal growth and learning' },
                { value: 'autonomy', text: '🔓 Autonomy and independence' },
                { value: 'recognition', text: '⭐ Recognition and achievement' },
                { value: 'security', text: '🛡️ Stability and security' },
                { value: 'creativity', text: '🎨 Creative expression' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'motivation_driver',
              title: 'What motivates you most at work?',
              choices: [
                { value: 'challenge', text: 'Solving challenging problems' },
                { value: 'people', text: 'Working with great people' },
                { value: 'results', text: 'Seeing tangible results' },
                { value: 'learning', text: 'Learning new things' },
                { value: 'purpose', text: 'Contributing to a larger purpose' }
              ],
              isRequired: true
            }
          ]
        },
        {
          name: 'work_style',
          title: 'Work Style Preferences',
          elements: [
            {
              type: 'radiogroup',
              name: 'structure_preference',
              title: 'How much structure do you prefer in your work?',
              choices: [
                { value: 'high', text: 'High structure - clear processes and guidelines' },
                { value: 'moderate', text: 'Moderate - some guidance with flexibility' },
                { value: 'low', text: 'Low - define my own approach' },
                { value: 'varies', text: 'Varies by project type' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'risk_tolerance',
              title: 'How do you feel about taking risks at work?',
              choices: [
                { value: 'embrace', text: '🎲 Embrace risk - high risk, high reward' },
                { value: 'calculated', text: '📊 Calculated risks with data backing' },
                { value: 'cautious', text: '🛡️ Cautious - prefer proven approaches' },
                { value: 'avoid', text: '🔒 Risk-averse - prioritize stability' }
              ],
              isRequired: true
            },
            {
              type: 'checkbox',
              name: 'ideal_project',
              title: 'What makes a project exciting for you? (Select all that apply)',
              choices: [
                { value: 'innovation', text: '💡 Working on something new and innovative' },
                { value: 'impact', text: '🌟 High visibility and impact' },
                { value: 'team', text: '👥 Great team dynamics' },
                { value: 'autonomy', text: '🔑 High autonomy and ownership' },
                { value: 'learning', text: '📚 Learning opportunities' },
                { value: 'challenge', text: '🧗 Technical challenges' }
              ],
              isRequired: true
            }
          ]
        },
        {
          name: 'growth_goals',
          title: 'Growth & Goals',
          elements: [
            {
              type: 'radiogroup',
              name: 'career_direction',
              title: 'Where do you see your career heading?',
              choices: [
                { value: 'leadership', text: '👔 Leadership and management' },
                { value: 'expert', text: '🎯 Deep expertise / specialist' },
                { value: 'entrepreneur', text: '🚀 Entrepreneurship' },
                { value: 'portfolio', text: '🎨 Portfolio career / variety' },
                { value: 'exploring', text: '🧭 Still exploring options' }
              ],
              isRequired: true
            },
            {
              type: 'rating',
              name: 'work_life_balance',
              title: 'How important is work-life balance to you?',
              rateMin: 1,
              rateMax: 5,
              minRateDescription: 'Work is my priority',
              maxRateDescription: 'Balance is essential',
              isRequired: true
            }
          ]
        }
      ]
    }
  },
  // Problem-Solving Style Quiz
  {
    title: 'Problem-Solving Style Quiz',
    description: 'Discover your unique approach to tackling challenges and solving problems. Learn how your problem-solving style complements others.',
    visibility: 'public',
    mode: 'take',
    is_published: true,
    survey_json: {
      title: 'Problem-Solving Style',
      description: 'How do you approach challenges?',
      showProgressBar: 'top',
      progressBarType: 'pages',
      pages: [
        {
          name: 'approach',
          title: 'Problem-Solving Approach',
          elements: [
            {
              type: 'radiogroup',
              name: 'first_reaction',
              title: 'When faced with a new problem, you first:',
              choices: [
                { value: 'analyze', text: '🔬 Gather data and analyze the situation' },
                { value: 'brainstorm', text: '💭 Brainstorm possible solutions' },
                { value: 'act', text: '⚡ Take immediate action to test ideas' },
                { value: 'consult', text: '👥 Consult with others for input' },
                { value: 'research', text: '📚 Research how others solved similar problems' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'thinking_style',
              title: 'How would you describe your thinking style?',
              choices: [
                { value: 'logical', text: '🧠 Logical and systematic' },
                { value: 'creative', text: '🎨 Creative and intuitive' },
                { value: 'practical', text: '🔧 Practical and hands-on' },
                { value: 'strategic', text: '♟️ Strategic and big-picture' },
                { value: 'collaborative', text: '🤝 Collaborative and inclusive' }
              ],
              isRequired: true
            }
          ]
        },
        {
          name: 'handling_complexity',
          title: 'Handling Complexity',
          elements: [
            {
              type: 'radiogroup',
              name: 'complexity_preference',
              title: 'When it comes to problem complexity:',
              choices: [
                { value: 'simple', text: 'Prefer breaking down into simple parts' },
                { value: 'complex', text: 'Enjoy tackling complex, multi-faceted problems' },
                { value: 'novel', text: 'Love problems no one has solved before' },
                { value: 'optimization', text: 'Prefer optimizing existing solutions' }
              ],
              isRequired: true
            },
            {
              type: 'radiogroup',
              name: 'under_pressure',
              title: 'How do you perform under pressure?',
              choices: [
                { value: 'thrive', text: '🔥 I thrive under pressure' },
                { value: 'steady', text: '⚖️ I stay steady and focused' },
                { value: 'need_time', text: '⏰ I need time to think clearly' },
                { value: 'delegate', text: '🤝 I delegate and collaborate more' }
              ],
              isRequired: true
            },
            {
              type: 'rating',
              name: 'ambiguity_tolerance',
              title: 'How comfortable are you with ambiguous problems?',
              rateMin: 1,
              rateMax: 5,
              minRateDescription: 'Need clear definition',
              maxRateDescription: 'Embrace ambiguity',
              isRequired: true
            }
          ]
        },
        {
          name: 'learning_from_problems',
          title: 'Learning & Growth',
          elements: [
            {
              type: 'radiogroup',
              name: 'failure_response',
              title: 'When a solution doesn\'t work, you:',
              choices: [
                { value: 'iterate', text: '🔄 Quickly iterate and try again' },
                { value: 'analyze', text: '🔍 Deeply analyze what went wrong' },
                { value: 'pivot', text: '↪️ Pivot to a completely new approach' },
                { value: 'seek_help', text: '🆘 Seek help and fresh perspectives' }
              ],
              isRequired: true
            },
            {
              type: 'checkbox',
              name: 'problem_solving_tools',
              title: 'Which tools/methods do you rely on? (Select all that apply)',
              choices: [
                { value: 'data', text: '📊 Data analysis and metrics' },
                { value: 'whiteboard', text: '📝 Whiteboarding and diagrams' },
                { value: 'discussion', text: '💬 Group discussions' },
                { value: 'prototyping', text: '🛠️ Prototyping and testing' },
                { value: 'frameworks', text: '📐 Established frameworks' },
                { value: 'intuition', text: '✨ Intuition and experience' }
              ],
              isRequired: true
            }
          ]
        }
      ]
    }
  }
];

// Badge definitions - using 'conditions' JSONB field per schema
const badgeDefinitions = [
  // Achievement Badges
  {
    badge_key: 'first_quiz',
    badge_name: 'Quiz Pioneer',
    badge_description: 'Completed your first quiz on the platform',
    badge_icon: '🎯',
    badge_color: '#10B981',
    badge_category: 'achievement',
    conditions: { type: 'quiz_count', min_quiz_count: 1 },
    xp_reward: 50,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'quiz_enthusiast',
    badge_name: 'Quiz Enthusiast',
    badge_description: 'Completed 5 quizzes',
    badge_icon: '🏆',
    badge_color: '#6366F1',
    badge_category: 'achievement',
    conditions: { type: 'quiz_count', min_quiz_count: 5 },
    xp_reward: 100,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'quiz_master',
    badge_name: 'Quiz Master',
    badge_description: 'Completed all available quizzes',
    badge_icon: '👑',
    badge_color: '#F59E0B',
    badge_category: 'achievement',
    conditions: { type: 'quiz_count', min_quiz_count: 10 },
    xp_reward: 250,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'early_adopter',
    badge_name: 'Early Adopter',
    badge_description: 'One of the first users to join the platform',
    badge_icon: '🚀',
    badge_color: '#14B8A6',
    badge_category: 'special',
    conditions: { type: 'custom' },
    xp_reward: 200,
    is_active: true,
    is_featured: true
  },
  
  // Communication Style Badges
  {
    badge_key: 'communication_master',
    badge_name: 'Communication Master',
    badge_description: 'Completed the Contact & Communication Profile Quiz',
    badge_icon: '💬',
    badge_color: '#3B82F6',
    badge_category: 'profile',
    conditions: { type: 'quiz_completion', quiz_title: 'Contact & Communication Profile Quiz' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'video_enthusiast',
    badge_name: 'Video Enthusiast',
    badge_description: 'Loves video communication and virtual meetings',
    badge_icon: '📹',
    badge_color: '#EC4899',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'video_comfort', min_value: 4 },
    xp_reward: 50,
    is_active: true,
    is_featured: false
  },
  {
    badge_key: 'async_champion',
    badge_name: 'Async Champion',
    badge_description: 'Prefers asynchronous communication and written updates',
    badge_icon: '📝',
    badge_color: '#8B5CF6',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'meeting_preference', value: 'async' },
    xp_reward: 50,
    is_active: true,
    is_featured: false
  },
  {
    badge_key: 'direct_communicator',
    badge_name: 'Direct Communicator',
    badge_description: 'Values direct and efficient communication',
    badge_icon: '🎯',
    badge_color: '#EF4444',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'feedback_style', value: 'direct' },
    xp_reward: 50,
    is_active: true,
    is_featured: false
  },
  
  // Travel & Location Badges
  {
    badge_key: 'world_explorer',
    badge_name: 'World Explorer',
    badge_description: 'Completed the Locations & Travel Profile Quiz',
    badge_icon: '🌍',
    badge_color: '#10B981',
    badge_category: 'profile',
    conditions: { type: 'quiz_completion', quiz_title: 'Locations & Travel Profile Quiz' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'globe_trotter',
    badge_name: 'Globe Trotter',
    badge_description: 'Has visited more than 15 countries',
    badge_icon: '✈️',
    badge_color: '#0EA5E9',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'countries_visited', values: ['16-30', '31-50', '50+'] },
    xp_reward: 100,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'digital_nomad',
    badge_name: 'Digital Nomad',
    badge_description: 'Works while traveling the world',
    badge_icon: '🏝️',
    badge_color: '#F59E0B',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'work_style', value: 'nomad' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'polyglot',
    badge_name: 'Polyglot',
    badge_description: 'Speaks 3 or more languages',
    badge_icon: '🗣️',
    badge_color: '#6366F1',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'languages', values: ['3', '4+'] },
    xp_reward: 100,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'adventure_seeker',
    badge_name: 'Adventure Seeker',
    badge_description: 'Loves exploring the unknown when traveling',
    badge_icon: '🏔️',
    badge_color: '#EF4444',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'adventure_level', min_value: 4 },
    xp_reward: 50,
    is_active: true,
    is_featured: false
  },
  
  // Collaboration Badges
  {
    badge_key: 'collaboration_complete',
    badge_name: 'Collaboration Expert',
    badge_description: 'Completed the Collaboration Style Assessment',
    badge_icon: '🤝',
    badge_color: '#3B82F6',
    badge_category: 'profile',
    conditions: { type: 'quiz_completion', quiz_title: 'Collaboration Style Assessment' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'natural_leader',
    badge_name: 'Natural Leader',
    badge_description: 'Takes charge and coordinates teams naturally',
    badge_icon: '👑',
    badge_color: '#F59E0B',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'team_role', value: 'leader' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'idea_generator',
    badge_name: 'Idea Generator',
    badge_description: 'Known for generating creative ideas and solutions',
    badge_icon: '💡',
    badge_color: '#8B5CF6',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'team_role', value: 'innovator' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'team_harmonizer',
    badge_name: 'Team Harmonizer',
    badge_description: 'Ensures everyone is heard and teams stay aligned',
    badge_icon: '🕊️',
    badge_color: '#10B981',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'team_role', value: 'harmonizer' },
    xp_reward: 75,
    is_active: true,
    is_featured: false
  },
  {
    badge_key: 'detail_analyst',
    badge_name: 'Detail Analyst',
    badge_description: 'Analyzes details and prevents mistakes',
    badge_icon: '🔍',
    badge_color: '#6366F1',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'team_role', value: 'analyst' },
    xp_reward: 75,
    is_active: true,
    is_featured: false
  },
  
  // Work Values Badges
  {
    badge_key: 'values_defined',
    badge_name: 'Values Defined',
    badge_description: 'Completed the Work Values & Motivation Quiz',
    badge_icon: '⭐',
    badge_color: '#EC4899',
    badge_category: 'profile',
    conditions: { type: 'quiz_completion', quiz_title: 'Work Values & Motivation Quiz' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'impact_driver',
    badge_name: 'Impact Driver',
    badge_description: 'Motivated by making a positive impact on the world',
    badge_icon: '🌟',
    badge_color: '#10B981',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'motivation_driver', value: 'purpose' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'growth_mindset',
    badge_name: 'Growth Mindset',
    badge_description: 'Driven by continuous learning and personal growth',
    badge_icon: '📈',
    badge_color: '#3B82F6',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'motivation_driver', value: 'learning' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'risk_taker',
    badge_name: 'Risk Taker',
    badge_description: 'Embraces risk for high rewards',
    badge_icon: '🎲',
    badge_color: '#EF4444',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'risk_tolerance', value: 'embrace' },
    xp_reward: 50,
    is_active: true,
    is_featured: false
  },
  {
    badge_key: 'balance_seeker',
    badge_name: 'Balance Seeker',
    badge_description: 'Values work-life balance highly',
    badge_icon: '⚖️',
    badge_color: '#8B5CF6',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'work_life_balance', min_value: 4 },
    xp_reward: 50,
    is_active: true,
    is_featured: false
  },
  
  // Problem-Solving Badges
  {
    badge_key: 'problem_solver',
    badge_name: 'Problem Solver',
    badge_description: 'Completed the Problem-Solving Style Quiz',
    badge_icon: '🧩',
    badge_color: '#F59E0B',
    badge_category: 'profile',
    conditions: { type: 'quiz_completion', quiz_title: 'Problem-Solving Style Quiz' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'data_driven',
    badge_name: 'Data Driven',
    badge_description: 'Approaches problems with data and analysis first',
    badge_icon: '📊',
    badge_color: '#3B82F6',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'first_reaction', value: 'analyze' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'creative_solver',
    badge_name: 'Creative Problem Solver',
    badge_description: 'Uses creativity and intuition to solve problems',
    badge_icon: '🎨',
    badge_color: '#EC4899',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'thinking_style', value: 'creative' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'pressure_performer',
    badge_name: 'Pressure Performer',
    badge_description: 'Thrives under pressure and tight deadlines',
    badge_icon: '🔥',
    badge_color: '#EF4444',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'under_pressure', value: 'thrive' },
    xp_reward: 75,
    is_active: true,
    is_featured: true
  },
  {
    badge_key: 'ambiguity_navigator',
    badge_name: 'Ambiguity Navigator',
    badge_description: 'Comfortable navigating uncertain and ambiguous situations',
    badge_icon: '🧭',
    badge_color: '#8B5CF6',
    badge_category: 'trait',
    conditions: { type: 'answer_match', question: 'ambiguity_tolerance', min_value: 4 },
    xp_reward: 75,
    is_active: true,
    is_featured: false
  }
];

// Create quizzes
async function createQuizzes(adminUserId) {
  console.log('\n📝 Creating sample quizzes...');
  
  for (const quiz of sampleQuizzes) {
    try {
      // Check if quiz already exists
      const { data: existing } = await supabase
        .from('quizzes')
        .select('id')
        .eq('title', quiz.title)
        .single();

      if (existing) {
        console.log(`   ⏭️ Quiz "${quiz.title}" already exists`);
        continue;
      }

      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title: quiz.title,
          description: quiz.description,
          visibility: quiz.visibility,
          mode: quiz.mode,
          is_published: quiz.is_published,
          survey_json: quiz.survey_json,
          created_by: adminUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed to create quiz "${quiz.title}":`, error.message);
      } else {
        console.log(`   ✅ Created quiz: ${quiz.title}`);
      }
    } catch (err) {
      console.error(`   ❌ Error creating quiz:`, err.message);
    }
  }
}

// Create badge definitions
async function createBadges() {
  console.log('\n🏅 Creating badge definitions...');
  
  for (const badge of badgeDefinitions) {
    try {
      const { error } = await supabase
        .from('badge_definitions')
        .upsert({
          ...badge,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'badge_key' });

      if (error) {
        console.error(`   ❌ Failed to create badge "${badge.badge_name}":`, error.message);
      } else {
        console.log(`   ✅ Created badge: ${badge.badge_icon} ${badge.badge_name}`);
      }
    } catch (err) {
      console.error(`   ❌ Error creating badge:`, err.message);
    }
  }
}

// Create sample quiz results for test users
async function createSampleQuizResults(users) {
  console.log('\n📊 Creating sample quiz results...');
  
  // Get quiz IDs
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, survey_json')
    .order('created_at', { ascending: true });

  if (!quizzes || quizzes.length === 0) {
    console.log('   ⏭️ No quizzes found, skipping quiz results');
    return;
  }

  for (const user of users) {
    // Get user ID by email
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === user.email);
    
    if (!authUser) continue;

    // Create 1-2 quiz results per user
    const numResults = user.role === 'viewer' ? 2 : 1;
    
    for (let i = 0; i < Math.min(numResults, quizzes.length); i++) {
      const quiz = quizzes[i];
      const score = Math.floor(Math.random() * 30) + 70; // 70-100
      
      try {
        // Check if result already exists
        const { data: existing } = await supabase
          .from('quiz_results')
          .select('id')
          .eq('user_id', authUser.id)
          .eq('quiz_id', quiz.id)
          .single();

        if (existing) {
          continue;
        }

        const { error } = await supabase
          .from('quiz_results')
          .insert({
            user_id: authUser.id,
            quiz_id: quiz.id,
            score: score, // percentage score
            is_passed: score >= 70,
            time_spent: Math.floor(Math.random() * 300) + 120, // 2-7 minutes in seconds
            survey_results: {
              team_preference: 'collaborate',
              communication_comfort: 4,
              conflict_resolution: 'mediate',
              strengths: ['analytical', 'communication']
            },
            completed_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (error) {
          console.error(`   ❌ Failed to create result for ${user.email}:`, error.message);
        } else {
          console.log(`   ✅ Created quiz result: ${user.email} → ${quiz.title} (${score}%)`);
        }
      } catch (err) {
        console.error(`   ❌ Error:`, err.message);
      }
    }
  }
}

// Award badges to users
async function awardBadges(users) {
  console.log('\n🎖️ Awarding badges to users...');
  
  for (const user of users) {
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.email === user.email);
    
    if (!authUser) continue;

    // Give "Quiz Pioneer" badge to all users
    try {
      const { error } = await supabase
        .from('user_badges')
        .upsert({
          user_id: authUser.id,
          badge_key: 'first_quiz',
          badge_name: 'Quiz Pioneer',
          badge_icon: '🎯',
          badge_color: '#10B981',
          earned_at: new Date().toISOString()
        }, { onConflict: 'user_id,badge_key' });

      if (!error) {
        console.log(`   ✅ Awarded "Quiz Pioneer" to ${user.email}`);
      }
    } catch (err) {
      // Ignore duplicate errors
    }

    // Give admin the "Early Adopter" badge
    if (user.role === 'admin') {
      try {
        const { error } = await supabase
          .from('user_badges')
          .upsert({
            user_id: authUser.id,
            badge_key: 'early_adopter',
            badge_name: 'Early Adopter',
            badge_icon: '🚀',
            badge_color: '#14B8A6',
            earned_at: new Date().toISOString()
          }, { onConflict: 'user_id,badge_key' });

        if (!error) {
          console.log(`   ✅ Awarded "Early Adopter" to ${user.email}`);
        }
      } catch (err) {
        // Ignore
      }
    }

    // Give facilitator the "Team Player" badge
    if (user.role === 'facilitator') {
      try {
        const { error } = await supabase
          .from('user_badges')
          .upsert({
            user_id: authUser.id,
            badge_key: 'team_player',
            badge_name: 'Team Player',
            badge_icon: '🤝',
            badge_color: '#3B82F6',
            earned_at: new Date().toISOString()
          }, { onConflict: 'user_id,badge_key' });

        if (!error) {
          console.log(`   ✅ Awarded "Team Player" to ${user.email}`);
        }
      } catch (err) {
        // Ignore
      }
    }
  }
}

async function runSeed() {
  console.log('\n🌱 Seeding Supabase Database...');
  console.log(`📍 URL: ${supabaseUrl}`);

  // First, delete existing test users
  await deleteExistingTestUsers();

  // Then create new users
  let successCount = 0;
  let adminUserId = null;
  
  for (const userData of testUsers) {
    const success = await createUser(userData);
    if (success) {
      successCount++;
      // Get admin user ID for creating quizzes
      if (userData.role === 'admin') {
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const adminUser = authUsers?.users?.find(u => u.email === userData.email);
        adminUserId = adminUser?.id;
      }
    }
  }

  // Create quizzes (as admin)
  if (adminUserId) {
    await createQuizzes(adminUserId);
  }

  // Create badge definitions
  await createBadges();

  // Create sample quiz results
  await createSampleQuizResults(testUsers);

  // Award badges
  await awardBadges(testUsers);

  console.log('\n' + '='.repeat(60));
  
  if (successCount === testUsers.length) {
    console.log('\n🎉 Seed complete! All data created.\n');
  } else {
    console.log(`\n⚠️ Seed partially complete: ${successCount}/${testUsers.length} users created.\n`);
  }

  console.log('┌─────────────┬────────────────────────────────────┬──────────────────┐');
  console.log('│ Role        │ Email                              │ Password         │');
  console.log('├─────────────┼────────────────────────────────────┼──────────────────┤');
  console.log('│ Admin       │ admin@chartingthecourse.test       │ TestPassword123! │');
  console.log('│ Facilitator │ facilitator@chartingthecourse.test │ TestPassword123! │');
  console.log('│ Viewer      │ viewer@chartingthecourse.test      │ TestPassword123! │');
  console.log('└─────────────┴────────────────────────────────────┴──────────────────┘');
  
  console.log('\n📝 Sample Quizzes Created:');
  sampleQuizzes.forEach(q => console.log(`   • ${q.title}`));
  
  console.log('\n🏅 Badge Definitions Created:');
  badgeDefinitions.forEach(b => console.log(`   • ${b.badge_icon} ${b.badge_name}`));
  
  console.log('\n✨ You can now login with these credentials!\n');
}

runSeed().catch(console.error);
