// Tag Extraction and Badge Generation utilities
// Port of server/tagExtraction.ts for Supabase Edge Functions

/**
 * User tag structure for database
 */
export interface UserTag {
  user_id: string;
  quiz_result_id: string;
  tag_key: string;
  tag_value: string;
  tag_category: string | null;
  data_type: "string" | "number" | "boolean";
  numeric_value: number | null;
  question_name: string | null;
}

/**
 * Badge rule definition
 */
export interface BadgeRule {
  badgeKey: string;
  badgeName: string;
  badgeDescription?: string;
  badgeCategory?: string;
  badgeIcon?: string;
  conditions: {
    requiredTags?: string[];
    anyOfTags?: string[];
    minTagCount?: { category: string; count: number };
    tagValueMatch?: { tagKey: string; value: string };
  };
}

/**
 * Badge to be earned
 */
export interface EarnedBadge {
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_category: string | null;
  badge_icon: string | null;
  source_tag_keys: string[];
}

/**
 * Default badge rules
 */
export const DEFAULT_BADGE_RULES: BadgeRule[] = [
  {
    badgeKey: "collaborative-leader",
    badgeName: "Collaborative Leader",
    badgeDescription: "Demonstrates collaborative leadership style",
    badgeCategory: "personality",
    badgeIcon: "Users",
    conditions: {
      tagValueMatch: { tagKey: "leadership-style", value: "collaborative" },
    },
  },
  {
    badgeKey: "visual-communicator",
    badgeName: "Visual Communicator",
    badgeDescription: "Prefers visual communication methods",
    badgeCategory: "communication",
    badgeIcon: "Eye",
    conditions: {
      tagValueMatch: { tagKey: "communication-preference", value: "visual" },
    },
  },
  {
    badgeKey: "analytical-thinker",
    badgeName: "Analytical Thinker",
    badgeDescription: "Strong analytical and problem-solving skills",
    badgeCategory: "thinking",
    badgeIcon: "Brain",
    conditions: {
      anyOfTags: ["analytical", "problem-solver", "data-driven"],
    },
  },
];

/**
 * Extract tags from quiz submission based on custom properties in surveyJson
 */
export function extractTagsFromQuizSubmission(
  userId: string,
  quizResultId: string,
  surveyJson: any,
  surveyResults: Record<string, any>
): UserTag[] {
  const tags: UserTag[] = [];

  if (!surveyJson || typeof surveyJson !== "object") {
    return tags;
  }

  function processElement(element: any) {
    if (!element || !element.name) return;

    const userAnswer = surveyResults[element.name];
    if (userAnswer === undefined || userAnswer === null) return;

    const customTags = element.tags;
    const tagCategory = element.tagCategory;
    const profileDimension = element.profileDimension;
    const tagKey = element.tagKey;

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
        tags.push({
          user_id: userId,
          quiz_result_id: quizResultId,
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
          tags.push({
            user_id: userId,
            quiz_result_id: quizResultId,
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
        tags.push({
          user_id: userId,
          quiz_result_id: quizResultId,
          tag_key: profileDimension,
          tag_value: tagValue,
          tag_category: "profile-dimension",
          data_type: dataType,
          numeric_value: numericValue,
          question_name: element.name,
        });
      }
    }

    // Handle array answers
    if (Array.isArray(userAnswer)) {
      for (const value of userAnswer) {
        addTag(value);
      }
    }

    // Handle simple scalar values
    if (typeof userAnswer !== "object" && !Array.isArray(userAnswer)) {
      addTag(userAnswer);
    }

    // Handle choice-based questions with custom tags
    if (element.choices && Array.isArray(element.choices)) {
      for (const choice of element.choices) {
        if (typeof choice === "object" && choice.customTag) {
          const choiceValue = choice.value || choice.text;
          let selected = false;

          if (Array.isArray(userAnswer)) {
            selected = userAnswer.includes(choiceValue);
          } else {
            selected = userAnswer === choiceValue;
          }

          if (selected) {
            tags.push({
              user_id: userId,
              quiz_result_id: quizResultId,
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

    // Handle matrix and complex nested answers
    if (
      element.type === "matrix" ||
      element.type === "matrixdropdown" ||
      element.type === "matrixdynamic" ||
      element.type === "multipletext" ||
      (typeof userAnswer === "object" &&
        userAnswer !== null &&
        !Array.isArray(userAnswer))
    ) {
      const processNestedObject = (obj: any, path: string): void => {
        for (const [key, value] of Object.entries(obj)) {
          const nestedPath = path ? `${path}.${key}` : key;

          if (value === null || value === undefined) continue;

          if (Array.isArray(value)) {
            for (const item of value) {
              if (typeof item !== "object") {
                addTag(item, `${element.name}.${nestedPath}`);
              } else {
                processNestedObject(item, nestedPath);
              }
            }
          } else if (typeof value === "object") {
            processNestedObject(value, nestedPath);
          } else {
            const matrixTagKey = `${element.name}.${nestedPath}`;

            let matrixDataType: "string" | "number" | "boolean";
            let matrixNumericValue: number | null = null;
            let matrixTagValue: string;

            if (typeof value === "number") {
              matrixDataType = "number";
              matrixNumericValue = value;
              matrixTagValue = value.toString();
            } else if (typeof value === "boolean") {
              matrixDataType = "boolean";
              matrixNumericValue = value ? 1 : 0;
              matrixTagValue = value ? "yes" : "no";
            } else {
              matrixDataType = "string";
              matrixTagValue = String(value);
            }

            tags.push({
              user_id: userId,
              quiz_result_id: quizResultId,
              tag_key: matrixTagKey,
              tag_value: matrixTagValue,
              tag_category: tagCategory || element.matrixCategory || null,
              data_type: matrixDataType,
              numeric_value: matrixNumericValue,
              question_name: element.name,
            });
          }
        }
      };

      if (typeof userAnswer === "object" && userAnswer !== null) {
        processNestedObject(userAnswer, "");
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

  return tags;
}

/**
 * Determine which badges a user should earn based on their tags
 */
export function determineBadgesFromTags(
  userTags: Array<{
    tag_key: string;
    tag_value: string;
    tag_category: string | null;
  }>,
  customBadgeRules: BadgeRule[] = []
): EarnedBadge[] {
  const allRules = [...DEFAULT_BADGE_RULES, ...customBadgeRules];
  const earnedBadges: EarnedBadge[] = [];

  for (const rule of allRules) {
    let meetsConditions = true;
    const sourceTagKeys: string[] = [];

    // Check required tags
    if (rule.conditions.requiredTags) {
      for (const requiredTag of rule.conditions.requiredTags) {
        const hasTag = userTags.some((t) => t.tag_key === requiredTag);
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
      const hasAnyTag = rule.conditions.anyOfTags.some((tag) => {
        const found = userTags.some((t) => t.tag_key === tag);
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
        (t) =>
          t.tag_key === tagKey &&
          t.tag_value.toLowerCase() === value.toLowerCase()
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
      const categoryTags = userTags.filter((t) => t.tag_category === category);
      if (categoryTags.length >= count) {
        sourceTagKeys.push(...categoryTags.map((t) => t.tag_key));
      } else {
        meetsConditions = false;
      }
    }

    if (meetsConditions) {
      earnedBadges.push({
        badge_key: rule.badgeKey,
        badge_name: rule.badgeName,
        badge_description: rule.badgeDescription || null,
        badge_category: rule.badgeCategory || null,
        badge_icon: rule.badgeIcon || null,
        source_tag_keys: Array.from(new Set(sourceTagKeys)),
      });
    }
  }

  return earnedBadges;
}

