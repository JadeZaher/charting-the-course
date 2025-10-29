import type { InsertUserTag } from "@shared/schema";

/**
 * Extract tags from quiz submission based on custom properties in surveyJson
 * 
 * This function processes both the quiz definition (surveyJson) and user's answers (surveyResults)
 * to generate tags that will be used for:
 * - Badge generation
 * - User profile building
 * - Discovery/matching
 */
export function extractTagsFromQuizSubmission(
  userId: string,
  quizResultId: string,
  surveyJson: any,
  surveyResults: Record<string, any>
): InsertUserTag[] {
  const tags: InsertUserTag[] = [];

  if (!surveyJson || typeof surveyJson !== 'object') {
    return tags;
  }

  // Helper to recursively process elements (handles nested panels)
  function processElement(element: any) {
    if (!element || !element.name) return;

    const userAnswer = surveyResults[element.name];
    if (userAnswer === undefined || userAnswer === null) return;

    // Extract custom tag metadata from question
    const customTags = element.tags; // e.g., ["leadership", "personality"]
    const tagCategory = element.tagCategory; // e.g., "personality", "skills"
    const profileDimension = element.profileDimension; // e.g., "leadership-score"
    const tagKey = element.tagKey; // e.g., "leadership-style"

    // Helper to add a single tag
    function addTag(value: any, key?: string) {
      let dataType: "string" | "number" | "boolean";
      let numericValue: number | undefined;
      let tagValue: string;

      if (typeof value === 'number') {
        dataType = 'number';
        numericValue = value;
        tagValue = value.toString();
      } else if (typeof value === 'boolean') {
        dataType = 'boolean';
        numericValue = value ? 1 : 0;
        tagValue = value ? 'yes' : 'no';
      } else if (typeof value === 'string') {
        dataType = 'string';
        tagValue = value;
      } else {
        // Skip complex objects that can't be represented as simple tags
        return;
      }

      const effectiveTagKey = key || tagKey;

      // If explicit tagKey is provided, use it
      if (effectiveTagKey) {
        tags.push({
          userId,
          quizResultId,
          tagKey: effectiveTagKey,
          tagValue,
          tagCategory: tagCategory || null,
          dataType,
          numericValue,
          questionName: element.name,
        });
      }

      // If custom tags array is provided, create tags for each
      if (Array.isArray(customTags)) {
        for (const tag of customTags) {
          tags.push({
            userId,
            quizResultId,
            tagKey: tag,
            tagValue,
            tagCategory: tagCategory || null,
            dataType,
            numericValue,
            questionName: element.name,
          });
        }
      }

      // If profileDimension is specified, create a dimension tag
      if (profileDimension) {
        tags.push({
          userId,
          quizResultId,
          tagKey: profileDimension,
          tagValue,
          tagCategory: 'profile-dimension',
          dataType,
          numericValue,
          questionName: element.name,
        });
      }
    }

    // Handle array answers (checkboxes, tagbox, multi-select)
    if (Array.isArray(userAnswer)) {
      for (const value of userAnswer) {
        addTag(value);
      }
      // Don't return early - still need to check for choice customTags
    }

    // Handle simple scalar values
    if (typeof userAnswer !== 'object' && !Array.isArray(userAnswer)) {
      addTag(userAnswer);
    }

    // For choice-based questions, check if individual choices have custom tags
    // This runs for both single-select and multi-select questions
    if (element.choices && Array.isArray(element.choices)) {
      for (const choice of element.choices) {
        if (typeof choice === 'object' && choice.customTag) {
          // Check if user selected this choice (handle both single and multi-select)
          const choiceValue = choice.value || choice.text;
          let selected = false;

          if (Array.isArray(userAnswer)) {
            selected = userAnswer.includes(choiceValue);
          } else {
            selected = userAnswer === choiceValue;
          }

          if (selected) {
            tags.push({
              userId,
              quizResultId,
              tagKey: choice.customTag,
              tagValue: String(choiceValue),
              tagCategory: tagCategory || 'choice-tag',
              dataType: 'string',
              numericValue: undefined,
              questionName: element.name,
            });
          }
        }
      }
    }

    // Handle matrix questions and other complex nested answers
    if (element.type === 'matrix' || element.type === 'matrixdropdown' || element.type === 'matrixdynamic' ||
        element.type === 'multipletext' || (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer))) {
      
      const processNestedObject = (obj: any, path: string): void => {
        for (const [key, value] of Object.entries(obj)) {
          const nestedPath = path ? `${path}.${key}` : key;

          if (value === null || value === undefined) continue;

          if (Array.isArray(value)) {
            // Handle arrays within nested objects
            for (const item of value) {
              if (typeof item !== 'object') {
                addTag(item, `${element.name}.${nestedPath}`);
              } else {
                processNestedObject(item, nestedPath);
              }
            }
          } else if (typeof value === 'object') {
            // Recurse into nested objects
            processNestedObject(value, nestedPath);
          } else {
            // Scalar value - create tag
            const matrixTagKey = `${element.name}.${nestedPath}`;

              let matrixDataType: "string" | "number" | "boolean";
              let matrixNumericValue: number | undefined;
              let matrixTagValue: string;

              if (typeof value === 'number') {
                matrixDataType = 'number';
                matrixNumericValue = value;
                matrixTagValue = value.toString();
              } else if (typeof value === 'boolean') {
                matrixDataType = 'boolean';
                matrixNumericValue = value ? 1 : 0;
                matrixTagValue = value ? 'yes' : 'no';
              } else {
                matrixDataType = 'string';
                matrixTagValue = String(value);
              }

              tags.push({
                userId,
                quizResultId,
                tagKey: matrixTagKey,
                tagValue: matrixTagValue,
                tagCategory: tagCategory || element.matrixCategory || null,
                dataType: matrixDataType,
                numericValue: matrixNumericValue,
                questionName: element.name,
              });
          }
        }
      };

      if (typeof userAnswer === 'object' && userAnswer !== null) {
        processNestedObject(userAnswer, '');
      }
    }

    // Recursively process nested elements (panels, etc.)
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

  return tags;
}

/**
 * Badge consolidation rules - determines which tags trigger which badges
 * This is extensible and can be modified as quiz creators add new quizzes
 */
export interface BadgeRule {
  badgeKey: string;
  badgeName: string;
  badgeDescription?: string;
  badgeCategory?: string;
  badgeIcon?: string;
  // Conditions that must be met to earn this badge
  conditions: {
    // All of these tags must exist
    requiredTags?: string[];
    // At least one of these tags must exist
    anyOfTags?: string[];
    // Minimum count of tags in a category
    minTagCount?: { category: string; count: number };
    // Tag value must match
    tagValueMatch?: { tagKey: string; value: string };
  };
}

/**
 * Default badge rules - can be extended via database configuration
 */
export const DEFAULT_BADGE_RULES: BadgeRule[] = [
  {
    badgeKey: 'collaborative-leader',
    badgeName: 'Collaborative Leader',
    badgeDescription: 'Demonstrates collaborative leadership style',
    badgeCategory: 'personality',
    badgeIcon: 'Users',
    conditions: {
      tagValueMatch: { tagKey: 'leadership-style', value: 'collaborative' },
    },
  },
  {
    badgeKey: 'visual-communicator',
    badgeName: 'Visual Communicator',
    badgeDescription: 'Prefers visual communication methods',
    badgeCategory: 'communication',
    badgeIcon: 'Eye',
    conditions: {
      tagValueMatch: { tagKey: 'communication-preference', value: 'visual' },
    },
  },
  {
    badgeKey: 'analytical-thinker',
    badgeName: 'Analytical Thinker',
    badgeDescription: 'Strong analytical and problem-solving skills',
    badgeCategory: 'thinking',
    badgeIcon: 'Brain',
    conditions: {
      anyOfTags: ['analytical', 'problem-solver', 'data-driven'],
    },
  },
];

/**
 * Determine which badges a user should earn based on their tags
 */
export function determineBadgesFromTags(
  userTags: Array<{ tagKey: string; tagValue: string; tagCategory: string | null }>,
  customBadgeRules: BadgeRule[] = []
): Array<{ badgeKey: string; badgeName: string; badgeDescription?: string; badgeCategory?: string; badgeIcon?: string; sourceTagKeys: string[] }> {
  const allRules = [...DEFAULT_BADGE_RULES, ...customBadgeRules];
  const earnedBadges: Array<{ badgeKey: string; badgeName: string; badgeDescription?: string; badgeCategory?: string; badgeIcon?: string; sourceTagKeys: string[] }> = [];

  for (const rule of allRules) {
    let meetsConditions = true;
    const sourceTagKeys: string[] = [];

    // Check required tags
    if (rule.conditions.requiredTags) {
      for (const requiredTag of rule.conditions.requiredTags) {
        const hasTag = userTags.some(t => t.tagKey === requiredTag);
        if (hasTag) {
          sourceTagKeys.push(requiredTag);
        } else {
          meetsConditions = false;
          break;
        }
      }
    }

    // Check anyOf tags
    if (meetsConditions && rule.conditions.anyOfTags) {
      const hasAnyTag = rule.conditions.anyOfTags.some(tag => {
        const found = userTags.some(t => t.tagKey === tag);
        if (found) sourceTagKeys.push(tag);
        return found;
      });
      if (!hasAnyTag) {
        meetsConditions = false;
      }
    }

    // Check tag value match
    if (meetsConditions && rule.conditions.tagValueMatch) {
      const { tagKey, value } = rule.conditions.tagValueMatch;
      const matchingTag = userTags.find(
        t => t.tagKey === tagKey && t.tagValue.toLowerCase() === value.toLowerCase()
      );
      if (matchingTag) {
        sourceTagKeys.push(tagKey);
      } else {
        meetsConditions = false;
      }
    }

    // Check min tag count
    if (meetsConditions && rule.conditions.minTagCount) {
      const { category, count } = rule.conditions.minTagCount;
      const categoryTags = userTags.filter(t => t.tagCategory === category);
      if (categoryTags.length >= count) {
        sourceTagKeys.push(...categoryTags.map(t => t.tagKey));
      } else {
        meetsConditions = false;
      }
    }

    if (meetsConditions) {
      earnedBadges.push({
        badgeKey: rule.badgeKey,
        badgeName: rule.badgeName,
        badgeDescription: rule.badgeDescription,
        badgeCategory: rule.badgeCategory,
        badgeIcon: rule.badgeIcon,
        sourceTagKeys: Array.from(new Set(sourceTagKeys)), // Deduplicate
      });
    }
  }

  return earnedBadges;
}
