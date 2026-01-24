import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import { ThreeDimensionalDarkPanelless } from "survey-core/themes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  survey_json: any;
  time_limit: number | null;
  passing_score: number | null;
}

interface BadgeDefinition {
  id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string | null;
  badge_color: string | null;
  badge_category: string | null;
  conditions: any;
  xp_reward: number;
}

// Check if a badge condition is met
async function checkBadgeCondition(
  condition: any, 
  quizTitle: string, 
  surveyResults: Record<string, any>,
  userId: string
): Promise<boolean> {
  if (!condition || !condition.type) return false;
  
  switch (condition.type) {
    case 'quiz_completion':
      // Award badge for completing a specific quiz
      return condition.quiz_title === quizTitle;
    
    case 'quiz_count':
      // Award badge for completing X number of quizzes
      const { count } = await supabase
        .from('quiz_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      return (count || 0) >= (condition.min_quiz_count || 1);
    
    case 'answer_match':
      const answer = surveyResults[condition.question];
      if (answer === undefined) return false;
      
      // Check single value match
      if (condition.value !== undefined) {
        if (Array.isArray(answer)) {
          return answer.some(a => 
            String(a).toLowerCase() === String(condition.value).toLowerCase()
          );
        }
        return String(answer).toLowerCase() === String(condition.value).toLowerCase();
      }
      
      // Check array of values
      if (condition.values && Array.isArray(condition.values)) {
        if (Array.isArray(answer)) {
          return answer.some(a => 
            condition.values.some((v: string) => String(a).toLowerCase() === String(v).toLowerCase())
          );
        }
        return condition.values.some((v: string) => 
          String(answer).toLowerCase() === String(v).toLowerCase()
        );
      }
      
      // Check minimum value (for ratings)
      if (condition.min_value !== undefined) {
        const numAnswer = Number(answer);
        return !isNaN(numAnswer) && numAnswer >= condition.min_value;
      }
      
      return false;
    
    default:
      return false;
  }
}

// Extract calculatedValues from SurveyJS results (profile_* prefixed keys)
function extractCalculatedValues(surveyResults: Record<string, any>): Record<string, any> {
  const calculatedValues: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(surveyResults)) {
    // Look for profile_* prefixed keys (from SurveyJS calculatedValues)
    if (key.startsWith('profile_')) {
      calculatedValues[key] = value;
    }
  }
  
  return calculatedValues;
}

// Sync profile using Survey Models wipe-and-replace approach
async function syncProfileFromQuiz(
  userId: string,
  quizId: string,
  calculatedValues: Record<string, any>
): Promise<{ synced: boolean; result: any }> {
  if (Object.keys(calculatedValues).length === 0) {
    return { synced: false, result: null };
  }
  
  try {
    // Call the database function for wipe-and-replace
    const { data, error } = await supabase.rpc('sync_profile_from_quiz', {
      p_user_id: userId,
      p_quiz_id: quizId,
      p_calculated_values: calculatedValues
    });
    
    if (error) {
      console.error('Profile sync error:', error);
      return { synced: false, result: null };
    }
    
    return { synced: true, result: data };
  } catch (err) {
    console.error('Profile sync failed:', err);
    return { synced: false, result: null };
  }
}

// Award badges and XP based on quiz results
async function awardBadgesAndXP(
  userId: string, 
  quizId: string,
  quizTitle: string, 
  surveyResults: Record<string, any>,
  scorePercent: number
): Promise<{ badgesAwarded: string[], xpEarned: number, profileSynced: boolean }> {
  let xpEarned = 0;
  const badgesAwarded: string[] = [];
  let profileSynced = false;
  
  try {
    // 1. First, handle Survey Models calculatedValues (if present)
    const calculatedValues = extractCalculatedValues(surveyResults);
    if (Object.keys(calculatedValues).length > 0) {
      const syncResult = await syncProfileFromQuiz(userId, quizId, calculatedValues);
      profileSynced = syncResult.synced;
      
      // Extract badges from sync result
      if (syncResult.result?.badges) {
        badgesAwarded.push(...syncResult.result.badges);
      }
    }
    
    // 2. Base XP for completing a quiz (10-50 XP based on score)
    const baseXP = Math.max(10, Math.round(scorePercent / 2));
    xpEarned += baseXP;
    
    // 3. Award badges based on badge_definitions conditions (legacy approach)
    // This runs in addition to calculatedValues for backward compatibility
    const { data: badges, error: badgesError } = await supabase
      .from('badge_definitions')
      .select('*')
      .eq('is_active', true);
    
    if (badgesError || !badges) {
      console.error('Failed to fetch badges:', badgesError);
    } else {
      // Fetch already earned badges for this user
      const { data: earnedBadges } = await supabase
        .from('user_badges')
        .select('badge_key')
        .eq('user_id', userId);
      
      const earnedBadgeKeys = new Set(earnedBadges?.map(b => b.badge_key) || []);
      
      // Check each badge
      const badgesToAward: BadgeDefinition[] = [];
      
      for (const badge of badges) {
        // Skip if already earned (from this or previous method)
        if (earnedBadgeKeys.has(badge.badge_key)) continue;
        if (badgesAwarded.includes(badge.badge_name)) continue;
        
        // Check if condition is met
        const conditionMet = await checkBadgeCondition(
          badge.conditions, 
          quizTitle, 
          surveyResults,
          userId
        );
        
        if (conditionMet) {
          badgesToAward.push(badge);
        }
      }
      
      // Award the badges
      if (badgesToAward.length > 0) {
      const badgeInserts = badgesToAward.map(badge => ({
        user_id: userId,
        badge_key: badge.badge_key,
        badge_name: badge.badge_name,
        badge_description: badge.badge_description,
        badge_icon: badge.badge_icon,
        badge_category: badge.badge_category,
        earned_at: new Date().toISOString(),
        strength: 1,
      }));
        
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert(badgeInserts);
        
        if (insertError) {
          console.error('Failed to award badges:', insertError);
        } else {
          badgesAwarded.push(...badgesToAward.map(b => b.badge_name));
          
          // Add badge XP rewards
          const badgeXP = badgesToAward.reduce((sum, b) => sum + (b.xp_reward || 0), 0);
          xpEarned += badgeXP;
        }
      }
    }
    
    // Update user XP (base + badge rewards)
    if (xpEarned > 0) {
      // First, check if user_xp_levels record exists
      const { data: existingXP } = await supabase
        .from('user_xp_levels')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const today = new Date().toISOString().split('T')[0];
      
      if (!existingXP) {
        // Create initial XP record
        await supabase
          .from('user_xp_levels')
          .insert({
            user_id: userId,
            total_xp: xpEarned,
            current_level: 1,
            quiz_streak: 1,
            longest_streak: 1,
            last_quiz_date: today,
            updated_at: new Date().toISOString()
          });
      } else {
        // Update existing XP
        const newXP = (existingXP.total_xp || 0) + xpEarned;
        const newLevel = Math.max(1, Math.floor(newXP / 100) + 1);
        
        // Check if this is a streak day
        const lastActivity = existingXP.last_quiz_date;
        let newStreak = existingXP.quiz_streak || 0;
        
        if (lastActivity) {
          const lastDate = new Date(lastActivity);
          const todayDate = new Date(today);
          const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak += 1; // Consecutive day
          } else if (diffDays > 1) {
            newStreak = 1; // Streak broken
          }
          // diffDays === 0 means same day, keep streak
        } else {
          newStreak = 1;
        }
        
        const longestStreak = Math.max(existingXP.longest_streak || 0, newStreak);
        
        await supabase
          .from('user_xp_levels')
          .update({
            total_xp: newXP,
            current_level: newLevel,
            quiz_streak: newStreak,
            longest_streak: longestStreak,
            last_quiz_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
      
    }
    
  } catch (error) {
    console.error('Error in awardBadgesAndXP:', error);
  }
  
  return { badgesAwarded, xpEarned, profileSynced };
}

export default function TakeQuiz() {
  const [, params] = useRoute("/quiz/take/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSupabaseAuth();
  const [survey, setSurvey] = useState<Model | null>(null);
  const [startTime] = useState(Date.now());

  const quizId = params?.id;

  const { data: quiz, isLoading, error } = useQuery<Quiz>({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, survey_json, time_limit, passing_score')
        .eq('id', quizId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!quizId,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (data: { surveyResults: any; timeSpent: number }) => {
      if (!user?.id || !quizId || !quiz) throw new Error('Not authenticated or quiz not found');
      
      // 1. Check retake rules
      if (!quiz.allow_retakes) {
        const { data: existingResult } = await supabase
          .from('quiz_results')
          .select('id')
          .eq('user_id', user.id)
          .eq('quiz_id', quizId)
          .maybeSingle();
        
        if (existingResult) {
          throw new Error('You have already completed this quiz and retakes are not allowed.');
        }
      }
      
      // 2. Calculate score
      let score = 0;
      let isPassed = true;
      let correctCount = 0;
      let totalQuestions = 0;
      
      if (quiz.survey_json && typeof quiz.survey_json === 'object') {
        const surveyDef = quiz.survey_json as any;
        
        if (surveyDef.pages && Array.isArray(surveyDef.pages)) {
          for (const page of surveyDef.pages) {
            if (page.elements && Array.isArray(page.elements)) {
              for (const element of page.elements) {
                if (element.correctAnswer !== undefined && element.correctAnswer !== null) {
                  totalQuestions++;
                  const userAnswer = data.surveyResults[element.name];
                  
                  if (userAnswer !== undefined) {
                    const userAnswerStr = String(userAnswer).trim().toLowerCase();
                    const correctAnswerStr = String(element.correctAnswer).trim().toLowerCase();
                    
                    if (userAnswerStr === correctAnswerStr) {
                      correctCount++;
                    }
                  }
                }
              }
            }
          }
        }
        
        score = totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;
      }
      
      // Check passing score
      if (quiz.passing_score) {
        isPassed = score >= quiz.passing_score;
      }
      
      // 3. Save quiz result
      const { data: quizResult, error: resultError } = await supabase
        .from('quiz_results')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          survey_results: data.surveyResults,
          score,
          is_passed: isPassed,
          time_spent: data.timeSpent || null,
          is_imported: false,
        })
        .select()
        .single();
      
      if (resultError) {
        console.error('Error saving quiz result:', resultError);
        throw new Error(`Failed to save quiz result: ${resultError.message}`);
      }
      
      if (!quizResult) {
        throw new Error('Failed to save quiz result: no data returned');
      }
      
      // 4. Clean up tags from previous quiz attempts (retakes)
      const { data: previousResults } = await supabase
        .from('quiz_results')
        .select('id')
        .eq('user_id', user.id)
        .eq('quiz_id', quizId)
        .neq('id', quizResult.id)
        .order('completed_at', { ascending: false });
      
      if (previousResults && previousResults.length > 0) {
        for (const prevResult of previousResults) {
          await supabase
            .from('user_tags')
            .delete()
            .eq('quiz_result_id', prevResult.id);
        }
      }
      
      // 5. Extract tags from quiz submission (simplified version)
      const extractedTags: any[] = [];
      if (quiz.survey_json && typeof quiz.survey_json === 'object') {
        const surveyDef = quiz.survey_json as any;
        
        function processElement(element: any) {
          if (!element || !element.name) return;
          
          const userAnswer = data.surveyResults[element.name];
          if (userAnswer === undefined || userAnswer === null) return;
          
          const tagKey = element.tagKey;
          const tagCategory = element.tagCategory;
          const customTags = element.tags;
          const profileDimension = element.profileDimension;
          
          function addTag(value: any, key?: string) {
            let dataType: "string" | "number" | "boolean";
            let numericValue: number | null = null;
            let tagValue: string;
            
            if (typeof value === "number") {
              dataType = "number";
              numericValue = value;
              tagValue = value.toString();
            } else if (typeof value === "boolean") {
              dataType = "boolean";
              numericValue = value ? 1 : 0;
              tagValue = value ? "yes" : "no";
            } else if (typeof value === "string") {
              dataType = "string";
              tagValue = value;
            } else {
              return;
            }
            
            const effectiveTagKey = key || tagKey;
            if (effectiveTagKey) {
              extractedTags.push({
                user_id: user.id,
                quiz_result_id: quizResult.id,
                tag_key: effectiveTagKey,
                tag_value: tagValue,
                tag_category: tagCategory || null,
                data_type: dataType,
                numeric_value: numericValue,
                question_name: element.name,
              });
            }
            
            if (Array.isArray(customTags)) {
              for (const tag of customTags) {
                extractedTags.push({
                  user_id: user.id,
                  quiz_result_id: quizResult.id,
                  tag_key: tag,
                  tag_value: tagValue,
                  tag_category: tagCategory || null,
                  data_type: dataType,
                  numeric_value: numericValue,
                  question_name: element.name,
                });
              }
            }
            
            if (profileDimension) {
              extractedTags.push({
                user_id: user.id,
                quiz_result_id: quizResult.id,
                tag_key: profileDimension,
                tag_value: tagValue,
                tag_category: "profile-dimension",
                data_type: dataType,
                numeric_value: numericValue,
                question_name: element.name,
              });
            }
          }
          
          if (Array.isArray(userAnswer)) {
            for (const value of userAnswer) {
              addTag(value);
            }
          } else if (typeof userAnswer !== 'object') {
            addTag(userAnswer);
          }
          
          // Handle choice-based questions with custom tags
          if (element.choices && Array.isArray(element.choices)) {
            for (const choice of element.choices) {
              if (typeof choice === 'object' && choice.customTag) {
                const choiceValue = choice.value || choice.text;
                let selected = false;
                
                if (Array.isArray(userAnswer)) {
                  selected = userAnswer.includes(choiceValue);
                } else {
                  selected = userAnswer === choiceValue;
                }
                
                if (selected) {
                  extractedTags.push({
                    user_id: user.id,
                    quiz_result_id: quizResult.id,
                    tag_key: choice.customTag,
                    tag_value: String(choiceValue),
                    tag_category: tagCategory || "choice-tag",
                    data_type: "string",
                    numeric_value: null,
                    question_name: element.name,
                  });
                }
              }
            }
          }
          
          // Recursively process nested elements
          if (element.elements && Array.isArray(element.elements)) {
            for (const nestedElement of element.elements) {
              processElement(nestedElement);
            }
          }
        }
        
        if (surveyDef.pages && Array.isArray(surveyDef.pages)) {
          for (const page of surveyDef.pages) {
            if (page.elements && Array.isArray(page.elements)) {
              for (const element of page.elements) {
                processElement(element);
              }
            }
          }
        }
      }
      
      // 6. Save tags to database
      let tagsCreated = 0;
      if (extractedTags.length > 0) {
        const { error: tagsError } = await supabase
          .from('user_tags')
          .insert(extractedTags);
        
        if (tagsError) {
          console.error('Error saving tags:', tagsError);
        } else {
          tagsCreated = extractedTags.length;
        }
      }
      
      // 7. Recalculate badges from ALL current tags
      // Delete all existing badges and rebuild from scratch
      await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id);
      
      // Get all user tags
      const { data: allUserTags } = await supabase
        .from('user_tags')
        .select('tag_key, tag_value, tag_category')
        .eq('user_id', user.id);
      
      // Simple badge determination based on tag patterns
      let badgesCreated = 0;
      if (allUserTags && allUserTags.length > 0) {
        const badgeInserts: any[] = [];
        
        // Check for common badge patterns
        const tagKeys = new Set(allUserTags.map(t => t.tag_key));
        
        // Collaborative Leader badge
        if (tagKeys.has('leadership-style') || 
            allUserTags.some(t => t.tag_key === 'leadership-style' && t.tag_value.toLowerCase() === 'collaborative')) {
          badgeInserts.push({
            user_id: user.id,
            badge_key: 'collaborative-leader',
            badge_name: 'Collaborative Leader',
            badge_description: 'Demonstrates collaborative leadership style',
            badge_category: 'personality',
            badge_icon: '👥',
            strength: 1,
            source_tag_keys: ['leadership-style'],
          });
        }
        
        // Add more badge patterns as needed
        
        if (badgeInserts.length > 0) {
          const { error: badgesError } = await supabase
            .from('user_badges')
            .insert(badgeInserts);
          
          if (!badgesError) {
            badgesCreated = badgeInserts.length;
          }
        }
      }
      
      // 8. Calculate additional XP and handle profile sync from Survey Models calculatedValues
      const { badgesAwarded, xpEarned, profileSynced } = await awardBadgesAndXP(
        user.id,
        quizId,
        quiz.title || '', 
        data.surveyResults,
        score
      );
      
      // Combine badges from both sources
      const allBadgesAwarded = badgesAwarded.length > 0 
        ? badgesAwarded 
        : (badgesCreated > 0 ? [`${badgesCreated} badge${badgesCreated > 1 ? 's' : ''} earned`] : []);
      
      return { 
        result: quizResult, 
        badgesAwarded: allBadgesAwarded,
        xpEarned, 
        profileSynced,
        tagsCreated,
        badgesEarned: badgesCreated,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-quiz-results'] });
      queryClient.invalidateQueries({ queryKey: ['user-xp'] });
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      queryClient.invalidateQueries({ queryKey: ['user-tags'] });
      queryClient.invalidateQueries({ queryKey: ['user-dimensions'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-data'] });
      
      // Show success message with XP earned
      let description = "Your answers have been saved successfully";
      if (data.xpEarned > 0) {
        description += ` • Earned ${data.xpEarned} XP!`;
      }
      if (data.badgesAwarded.length > 0) {
        description += ` • New badge${data.badgesAwarded.length > 1 ? 's' : ''}: ${data.badgesAwarded.join(', ')}`;
      }
      if (data.profileSynced) {
        description += ` • Profile updated!`;
      }
      
      toast({
        title: "Quiz Submitted! 🎉",
        description,
      });
      setLocation(`/quiz/results/${quizId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (quiz && quiz.survey_json) {
      try {
        const surveyModel = new Model(quiz.survey_json);
        
        // Apply theme to match the app's design
        surveyModel.applyTheme(ThreeDimensionalDarkPanelless);

        surveyModel.onComplete.add((sender) => {
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);

          submitQuizMutation.mutate({
            surveyResults: sender.data,
            timeSpent,
          });
        });

        if (quiz.time_limit) {
          surveyModel.maxTimeToFinish = quiz.time_limit * 60;
          surveyModel.showTimerPanel = "top";
        }

        setSurvey(surveyModel);
      } catch (error) {
        console.error("Error creating survey model:", error);
        toast({
          title: "Error",
          description: "Failed to load quiz content",
          variant: "destructive",
        });
      }
    }
  }, [quiz, startTime]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading quiz...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <p className="text-destructive">
              {error ? (error as Error).message : "Quiz not found"}
            </p>
            <Button onClick={() => setLocation("/quizzes")} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLocation("/quizzes")}
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-quiz-title">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-muted-foreground mt-1">{quiz.description}</p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {survey ? (
            <Survey model={survey} />
          ) : (
            <div className="text-center p-12">
              <p className="text-muted-foreground">Initializing quiz...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
