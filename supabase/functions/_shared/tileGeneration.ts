// Tile Generation Strategy Engine
// Phase 4: Converts quiz answers to profile tiles instead of tags/badges

/**
 * Tile types supported by the profile_tiles table
 */
export type TileType = 'badge' | 'text' | 'chart' | 'list' | 'score' | 'custom';

/**
 * Profile dimensions for organizing tiles
 */
export type ProfileDimension = 'personality' | 'strengths' | 'values' | 'interests' | 'growth';

/**
 * Profile tile structure for database insertion
 */
export interface ProfileTile {
  user_id: string;
  submission_id: string;
  tile_type: TileType;
  dimension: ProfileDimension | null;
  title: string;
  content: TileContent;
  display_order: number;
  is_visible: boolean;
}

/**
 * Tile content structure - varies by tile_type
 */
export interface TileContent {
  // For text tiles
  text?: string;
  subtitle?: string;
  
  // For badge tiles
  badge_key?: string;
  badge_icon?: string;
  badge_color?: string;
  badge_description?: string;
  
  // For chart tiles
  chart_type?: 'bar' | 'radar' | 'pie' | 'line';
  chart_data?: Array<{ label: string; value: number; color?: string }>;
  
  // For list tiles
  items?: Array<{ label: string; value?: string; icon?: string }>;
  
  // For score tiles
  score_value?: number;
  score_max?: number;
  score_label?: string;
  
  // Generic metadata
  source_question?: string;
  source_answer?: unknown;
  tags?: string[];
  
  [key: string]: unknown;
}

/**
 * Strategy definition for processing a quiz
 */
export interface QuizStrategy {
  strategyId: string;
  name: string;
  description?: string;
  tileGenerators: TileGenerator[];
}

/**
 * Tile generator - defines how to create a tile from quiz data
 */
export interface TileGenerator {
  id: string;
  tileType: TileType;
  dimension?: ProfileDimension;
  title: string;
  displayOrder?: number;
  // Condition to apply this generator
  condition?: {
    questionName?: string;
    questionHasProperty?: string;
    answerEquals?: string;
    answerContains?: string[];
  };
  // Content template
  contentTemplate: {
    type: 'simple_answer' | 'aggregated' | 'mapped' | 'custom';
    questionNames?: string[];
    valueMapping?: Record<string, TileContent>;
    customProcessor?: string; // Name of custom processor function
  };
}

/**
 * Default strategy for assessment quizzes
 * Creates tiles based on profileDimension and tagKey properties in survey questions
 */
export const DEFAULT_ASSESSMENT_STRATEGY: QuizStrategy = {
  strategyId: 'default-assessment',
  name: 'Default Assessment Strategy',
  description: 'Auto-generates tiles from profileDimension and custom properties in survey questions',
  tileGenerators: [] // Dynamic generation based on survey structure
};

/**
 * Strategy registry - maps quiz IDs or quiz types to strategies
 */
const strategyRegistry: Map<string, QuizStrategy> = new Map();

/**
 * Register a custom strategy for a quiz
 */
export function registerStrategy(quizId: string, strategy: QuizStrategy): void {
  strategyRegistry.set(quizId, strategy);
}

/**
 * Validate that an object conforms to QuizStrategy shape
 */
function isValidQuizStrategy(obj: unknown): obj is QuizStrategy {
  if (!obj || typeof obj !== 'object') return false;
  
  const strategy = obj as Record<string, unknown>;
  
  // Must have strategyId and name as strings
  if (typeof strategy.strategyId !== 'string') return false;
  if (typeof strategy.name !== 'string') return false;
  
  // tileGenerators must be an array (can be empty)
  if (!Array.isArray(strategy.tileGenerators)) return false;
  
  // Validate each tile generator has required fields
  for (const gen of strategy.tileGenerators) {
    if (!gen || typeof gen !== 'object') return false;
    if (typeof (gen as any).id !== 'string') return false;
    if (typeof (gen as any).tileType !== 'string') return false;
    if (typeof (gen as any).title !== 'string') return false;
    if (!(gen as any).contentTemplate || typeof (gen as any).contentTemplate !== 'object') return false;
  }
  
  return true;
}

/**
 * Get strategy for a quiz - returns default if no custom strategy registered
 */
export function getStrategyForQuiz(quizId: string, surveyJson: any): QuizStrategy {
  // Check for registered custom strategy
  const customStrategy = strategyRegistry.get(quizId);
  if (customStrategy) {
    return customStrategy;
  }
  
  // Check if quiz has embedded strategy in metadata
  if (surveyJson?.metadata?.strategy) {
    // Validate the embedded strategy
    if (isValidQuizStrategy(surveyJson.metadata.strategy)) {
      return surveyJson.metadata.strategy;
    }
    // Invalid strategy shape - log warning and fall back to default
    console.warn('Quiz has invalid embedded strategy, using default');
  }
  
  // Return default assessment strategy
  return DEFAULT_ASSESSMENT_STRATEGY;
}

/**
 * Extract and format answer for display
 */
function formatAnswerForDisplay(answer: unknown, element: any): string {
  if (answer === undefined || answer === null) return '';
  
  // Handle array answers (multi-select)
  if (Array.isArray(answer)) {
    return answer.map(a => {
      if (element.choices) {
        const choice = element.choices.find((c: any) => 
          (c.value || c) === a
        );
        return choice?.text || choice || String(a);
      }
      return String(a);
    }).join(', ');
  }
  
  // Handle choice lookup for single answer
  if (element.choices) {
    const choice = element.choices.find((c: any) => 
      (c.value || c) === answer
    );
    if (choice?.text) return choice.text;
  }
  
  return String(answer);
}

/**
 * Get icon for a dimension
 */
function getDimensionIcon(dimension: ProfileDimension): string {
  const icons: Record<ProfileDimension, string> = {
    personality: 'Brain',
    strengths: 'Target',
    values: 'Heart',
    interests: 'Sparkles',
    growth: 'TrendingUp'
  };
  return icons[dimension] || 'Circle';
}

/**
 * Generate tiles from quiz submission using strategy engine
 */
export function generateTilesFromSubmission(
  userId: string,
  submissionId: string,
  surveyJson: any,
  surveyResults: Record<string, any>,
  strategy?: QuizStrategy
): ProfileTile[] {
  const tiles: ProfileTile[] = [];
  
  if (!surveyJson || typeof surveyJson !== 'object') {
    return tiles;
  }
  
  // Use provided strategy or default
  const activeStrategy = strategy || DEFAULT_ASSESSMENT_STRATEGY;
  
  let displayOrder = 0;
  
  // If strategy has explicit tile generators, apply them first
  if (activeStrategy.tileGenerators && activeStrategy.tileGenerators.length > 0) {
    for (const generator of activeStrategy.tileGenerators) {
      // Check if generator condition is met
      if (!checkGeneratorCondition(generator, surveyJson, surveyResults)) {
        continue;
      }
      
      // Generate tile based on content template
      const tile = applyGeneratorTemplate(
        userId,
        submissionId,
        generator,
        surveyJson,
        surveyResults,
        displayOrder++
      );
      
      if (tile) {
        tiles.push(tile);
      }
    }
  }
  
  // If no custom generators or using default strategy, auto-generate from survey structure
  if (activeStrategy.tileGenerators.length === 0) {
    const autoTiles = autoGenerateTilesFromSurvey(userId, submissionId, surveyJson, surveyResults);
    for (const tile of autoTiles) {
      tile.display_order = displayOrder++;
      tiles.push(tile);
    }
  }
  
  return tiles;
}

/**
 * Check if a tile generator's condition is met
 */
function checkGeneratorCondition(
  generator: TileGenerator,
  surveyJson: any,
  surveyResults: Record<string, any>
): boolean {
  if (!generator.condition) {
    return true; // No condition means always apply
  }
  
  const { questionName, questionHasProperty, answerEquals, answerContains } = generator.condition;
  
  // Check if specific question has an answer
  if (questionName) {
    const answer = surveyResults[questionName];
    if (answer === undefined || answer === null) {
      return false;
    }
    
    // Check if answer equals specific value
    if (answerEquals !== undefined) {
      if (String(answer).toLowerCase() !== String(answerEquals).toLowerCase()) {
        return false;
      }
    }
    
    // Check if answer contains any of the specified values
    if (answerContains && Array.isArray(answerContains)) {
      const answerArr = Array.isArray(answer) ? answer : [answer];
      const hasMatch = answerContains.some(v => 
        answerArr.some((a: any) => String(a).toLowerCase() === String(v).toLowerCase())
      );
      if (!hasMatch) {
        return false;
      }
    }
  }
  
  // Check if a question has a specific property
  if (questionHasProperty) {
    const found = findElementWithProperty(surveyJson, questionHasProperty);
    if (!found) {
      return false;
    }
  }
  
  return true;
}

/**
 * Find an element in survey JSON with a specific property
 */
function findElementWithProperty(surveyJson: any, propertyName: string): any {
  if (!surveyJson?.pages) return null;
  
  for (const page of surveyJson.pages) {
    if (!page.elements) continue;
    for (const element of page.elements) {
      if (element[propertyName] !== undefined) {
        return element;
      }
    }
  }
  return null;
}

/**
 * Apply a generator's content template to create a tile
 */
function applyGeneratorTemplate(
  userId: string,
  submissionId: string,
  generator: TileGenerator,
  surveyJson: any,
  surveyResults: Record<string, any>,
  displayOrder: number
): ProfileTile | null {
  const { contentTemplate, tileType, dimension, title } = generator;
  
  const content: TileContent = {};
  
  switch (contentTemplate.type) {
    case 'simple_answer': {
      // Get answer from specified question(s)
      const questionNames = contentTemplate.questionNames || [];
      if (questionNames.length === 1) {
        const answer = surveyResults[questionNames[0]];
        if (answer === undefined) return null;
        content.text = String(answer);
        content.source_question = questionNames[0];
        content.source_answer = answer;
      } else {
        content.items = questionNames
          .filter(q => surveyResults[q] !== undefined)
          .map(q => ({ label: q, value: String(surveyResults[q]) }));
      }
      break;
    }
    
    case 'mapped': {
      // Map answer value to tile content
      const questionNames = contentTemplate.questionNames || [];
      if (questionNames.length > 0 && contentTemplate.valueMapping) {
        const answer = String(surveyResults[questionNames[0]] || '').toLowerCase();
        const mappedContent = contentTemplate.valueMapping[answer];
        if (mappedContent) {
          Object.assign(content, mappedContent);
        }
      }
      break;
    }
    
    case 'aggregated': {
      // Aggregate multiple answers into a list or chart
      const questionNames = contentTemplate.questionNames || [];
      content.items = questionNames
        .filter(q => surveyResults[q] !== undefined)
        .map(q => ({ label: q, value: String(surveyResults[q]) }));
      break;
    }
    
    default:
      // Custom or unknown type - store raw data
      content.source_answer = surveyResults;
  }
  
  return {
    user_id: userId,
    submission_id: submissionId,
    tile_type: tileType,
    dimension: dimension || null,
    title,
    content,
    display_order: generator.displayOrder ?? displayOrder,
    is_visible: true
  };
}

/**
 * Auto-generate tiles from survey structure (default behavior)
 */
function autoGenerateTilesFromSurvey(
  userId: string,
  submissionId: string,
  surveyJson: any,
  surveyResults: Record<string, any>
): ProfileTile[] {
  const tiles: ProfileTile[] = [];
  
  // Group answers by dimension for aggregation
  const dimensionAnswers: Record<ProfileDimension, Array<{
    question: string;
    answer: string;
    element: any;
  }>> = {
    personality: [],
    strengths: [],
    values: [],
    interests: [],
    growth: []
  };
  
  let displayOrder = 0;
  
  // Process survey elements
  function processElement(element: any) {
    if (!element || !element.name) return;
    
    const userAnswer = surveyResults[element.name];
    if (userAnswer === undefined || userAnswer === null) return;
    
    const profileDimension = element.profileDimension as ProfileDimension;
    const tileType = element.tileType as TileType;
    const tagKey = element.tagKey;
    
    // Format the answer for display
    const formattedAnswer = formatAnswerForDisplay(userAnswer, element);
    
    // If question has profileDimension, group it
    if (profileDimension && dimensionAnswers[profileDimension]) {
      dimensionAnswers[profileDimension].push({
        question: element.title || element.name,
        answer: formattedAnswer,
        element
      });
    }
    
    // If question specifies a custom tile type, create individual tile
    if (tileType) {
      const content: TileContent = {
        source_question: element.name,
        source_answer: userAnswer
      };
      
      switch (tileType) {
        case 'text':
          content.text = formattedAnswer;
          content.subtitle = element.title || element.name;
          break;
        case 'badge':
          content.badge_key = tagKey || element.name;
          content.badge_icon = element.badgeIcon || getDimensionIcon(profileDimension);
          content.badge_color = element.badgeColor;
          content.badge_description = formattedAnswer;
          break;
        case 'score':
          const numValue = typeof userAnswer === 'number' ? userAnswer : 
            parseFloat(String(userAnswer)) || 0;
          content.score_value = numValue;
          content.score_max = element.scoreMax || 100;
          content.score_label = element.title || element.name;
          break;
        case 'list':
          content.items = Array.isArray(userAnswer) 
            ? userAnswer.map(v => ({ label: formatAnswerForDisplay(v, element) }))
            : [{ label: formattedAnswer }];
          break;
      }
      
      // Add tags if present
      if (element.tags && Array.isArray(element.tags)) {
        content.tags = element.tags;
      }
      
      tiles.push({
        user_id: userId,
        submission_id: submissionId,
        tile_type: tileType,
        dimension: profileDimension || null,
        title: element.tileTitle || element.title || element.name,
        content,
        display_order: displayOrder++,
        is_visible: true
      });
    }
    
    // Handle choice-based questions with customTag - create badge tiles
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
            tiles.push({
              user_id: userId,
              submission_id: submissionId,
              tile_type: 'badge',
              dimension: profileDimension || null,
              title: choice.customTag,
              content: {
                badge_key: choice.customTag,
                badge_icon: choice.badgeIcon || 'Award',
                badge_description: choice.text || choiceValue,
                source_question: element.name,
                source_answer: choiceValue
              },
              display_order: displayOrder++,
              is_visible: true
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
  
  // Process all pages and elements
  if (surveyJson.pages && Array.isArray(surveyJson.pages)) {
    for (const page of surveyJson.pages) {
      if (page.elements && Array.isArray(page.elements)) {
        for (const element of page.elements) {
          processElement(element);
        }
      }
    }
  }
  
  // Create aggregated dimension tiles (list type)
  for (const [dimension, answers] of Object.entries(dimensionAnswers) as [ProfileDimension, typeof dimensionAnswers['personality']][]) {
    if (answers.length > 0) {
      tiles.push({
        user_id: userId,
        submission_id: submissionId,
        tile_type: 'list',
        dimension,
        title: getDimensionTitle(dimension),
        content: {
          items: answers.map(a => ({
            label: a.question,
            value: a.answer
          })),
          icon: getDimensionIcon(dimension)
        },
        display_order: displayOrder++,
        is_visible: true
      });
    }
  }
  
  return tiles;
}

/**
 * Get human-readable title for a dimension
 */
function getDimensionTitle(dimension: ProfileDimension): string {
  const titles: Record<ProfileDimension, string> = {
    personality: 'Personality Traits',
    strengths: 'Key Strengths',
    values: 'Core Values',
    interests: 'Interests & Passions',
    growth: 'Growth Areas'
  };
  return titles[dimension] || dimension;
}

/**
 * Check if a quiz is an assessment (no correct answers) vs graded quiz
 */
export function isAssessmentQuiz(surveyJson: any): boolean {
  if (!surveyJson?.pages) return true;
  
  for (const page of surveyJson.pages) {
    if (!page.elements) continue;
    for (const element of page.elements) {
      if (element.correctAnswer !== undefined) {
        return false; // Has graded questions
      }
    }
  }
  
  return true; // No correct answers found = assessment
}

/**
 * Clean up old tiles from previous submissions of the same quiz
 */
export async function cleanupOldTiles(
  supabase: any,
  userId: string,
  quizId: string,
  currentSubmissionId: string
): Promise<void> {
  // Get previous submission IDs for this quiz
  const { data: previousResults } = await supabase
    .from('quiz_results')
    .select('id')
    .eq('user_id', userId)
    .eq('quiz_id', quizId)
    .neq('id', currentSubmissionId);
  
  if (previousResults && previousResults.length > 0) {
    const oldSubmissionIds = previousResults.map((r: any) => r.id);
    
    // Delete tiles from previous submissions
    await supabase
      .from('profile_tiles')
      .delete()
      .in('submission_id', oldSubmissionIds);
  }
}
