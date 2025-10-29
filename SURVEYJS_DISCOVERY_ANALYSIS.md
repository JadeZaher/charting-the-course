# SurveyJS Results Structure Analysis for User Discovery

## Executive Summary

**Answer: YES** - The SurveyJS result structure makes excellent sense for granular user discovery and matching.

The current implementation stores results as a flexible JSON object that preserves all answer details, making it ideal for comparing users based on quiz responses.

---

## Current Data Structure

### How Results Are Stored

```typescript
// Database Schema (quiz_results table)
{
  id: "uuid",
  userId: "user-123",
  quizId: "quiz-456",
  surveyResults: {
    // SurveyJS data object - structure varies by quiz
  },
  score: 85,              // Calculated percentage (0-100)
  isPassed: true,         // Boolean based on passing score
  timeSpent: 720,         // Seconds
  completedAt: "2025-01-15T10:30:00Z"
}
```

### Real Example from Database

**Quiz:** Teacher Evaluation Form

**User's Answers:**
```json
{
  "planning": {
    "interests": {
      "column-planning": 3
    }
  },
  "date-admin": "2025-10-28T04:29:23.322Z",
  "date-teacher": "2025-10-28T04:29:23.321Z",
  "classroom-instruction": {
    "a": {
      "column-classroom-instruction": true
    }
  }
}
```

### SurveyJS Question Types & Result Formats

| Question Type | Example Key | Result Format | Discovery Use Case |
|---------------|-------------|---------------|-------------------|
| **Text** | `teacher-name` | `"John Smith"` | Exact/fuzzy text matching |
| **Rating** | `planning.interests.column-planning` | `3` | Numeric similarity (3 vs 4) |
| **Boolean/Checkbox** | `classroom-instruction.a.column-classroom-instruction` | `true` | Binary match/mismatch |
| **Date** | `date-teacher` | `"2025-10-28T04:29:23.321Z"` | Temporal proximity |
| **Dropdown** | `user-role` | `"Facilitator"` | Categorical matching |
| **Matrix** | `planning.interests` | `{ "column-planning": 3 }` | Multi-dimensional comparison |
| **Comment** | `summary` | `"Long text response..."` | NLP/keyword analysis |
| **Radio Group** | `preferred-area` | `"communication"` | Category-based discovery |

---

## Strengths for User Discovery

### 1. **Granular Question-Level Data**
Each individual question answer is preserved, enabling precise matching:

```json
{
  "leadership-style": "collaborative",
  "conflict-preference": "mediation",
  "communication-mode": "visual"
}
```

**Discovery Queries:**
- Find users with same `leadership-style`
- Find users with opposite `conflict-preference`
- Find users who prefer `visual` communication

### 2. **Preserves Data Types**
Different answer types enable different comparison strategies:

```typescript
// Numeric (rating 1-5)
planning.content = 4  // User A
planning.content = 3  // User B
// Similarity: 75% (close match)

// Boolean
classroom-instruction.a = true   // User A
classroom-instruction.a = false  // User B  
// Similarity: 0% (opposite)

// Text
chosen-area = "technology"  // User A
chosen-area = "education"   // User B
// Similarity: 0% exact, could use fuzzy matching
```

### 3. **Flexible Schema**
Works with any SurveyJS quiz structure without schema changes:
- Personality assessments
- Skills inventories
- Interest surveys
- Learning style quizzes
- Team compatibility tests

### 4. **Nested Structures for Complex Assessments**
Matrix questions create multi-dimensional profiles:

```json
{
  "skills-matrix": {
    "planning": { "self-rating": 4, "peer-rating": 3 },
    "execution": { "self-rating": 3, "peer-rating": 4 },
    "communication": { "self-rating": 5, "peer-rating": 5 }
  }
}
```

**Discovery:**
- Find users with similar skill gaps (self vs peer)
- Find complementary skill sets
- Find users strong in areas where you're weak

---

## Discovery Implementation Strategies

### Strategy 1: Same-Quiz Comparison (Recommended First)

**Concept:** Compare users who took the same quiz

**Algorithm:**
```typescript
function calculateSimilarity(userA_results, userB_results, quiz) {
  let totalQuestions = 0;
  let matchingAnswers = 0;
  
  // Iterate through all questions in the quiz
  for (const question of extractQuestions(quiz.surveyJson)) {
    const answerA = userA_results[question.name];
    const answerB = userB_results[question.name];
    
    if (answerA !== undefined && answerB !== undefined) {
      totalQuestions++;
      
      if (question.type === 'rating') {
        // Numeric similarity (0-1 scale)
        const diff = Math.abs(answerA - answerB);
        const maxDiff = question.rateMax || 5;
        matchingAnswers += (1 - diff / maxDiff);
      } else if (question.type === 'boolean') {
        // Binary match
        matchingAnswers += (answerA === answerB ? 1 : 0);
      } else {
        // Exact string match
        matchingAnswers += (answerA === answerB ? 1 : 0);
      }
    }
  }
  
  return totalQuestions > 0 ? (matchingAnswers / totalQuestions) * 100 : 0;
}
```

**Example Output:**
- User A vs User B: 85% similar (took same quiz)
- User A vs User C: 92% similar (took same quiz)
- User A vs User D: Cannot compare (different quiz)

### Strategy 2: Tag-Based Profiles

**Concept:** Extract meaningful tags from quiz results

**Implementation:**
```typescript
// Add to database schema
export const userTags = pgTable("user_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  quizId: varchar("quiz_id").references(() => quizzes.id),
  tagKey: text("tag_key").notNull(),     // e.g., "leadership-style"
  tagValue: text("tag_value").notNull(), // e.g., "collaborative"
  dataType: text("data_type").notNull(), // "string", "number", "boolean"
  numericValue: integer("numeric_value"), // For ratings
  createdAt: timestamp("created_at").defaultNow(),
});

// Index for fast tag lookups
CREATE INDEX idx_user_tags_key_value ON user_tags(tag_key, tag_value);
CREATE INDEX idx_user_tags_user ON user_tags(user_id);
```

**Tag Extraction on Quiz Submit:**
```typescript
async function extractUserTags(userId, quizId, surveyResults) {
  const tags = [];
  
  for (const [key, value] of Object.entries(surveyResults)) {
    // Skip metadata fields
    if (key.startsWith('date-') || key.endsWith('-signature')) continue;
    
    // Handle different value types
    if (typeof value === 'number') {
      tags.push({
        userId,
        quizId,
        tagKey: key,
        tagValue: value.toString(),
        dataType: 'number',
        numericValue: value
      });
    } else if (typeof value === 'boolean') {
      tags.push({
        userId,
        quizId,
        tagKey: key,
        tagValue: value ? 'yes' : 'no',
        dataType: 'boolean',
        numericValue: value ? 1 : 0
      });
    } else if (typeof value === 'string') {
      tags.push({
        userId,
        quizId,
        tagKey: key,
        tagValue: value,
        dataType: 'string'
      });
    }
    // Handle nested objects (matrix questions) recursively
  }
  
  return tags;
}
```

**Discovery Queries:**
```sql
-- Find users with exact tag match
SELECT user_id, COUNT(*) as matching_tags
FROM user_tags
WHERE tag_key = 'leadership-style' AND tag_value = 'collaborative'
GROUP BY user_id
ORDER BY matching_tags DESC;

-- Find users with similar numeric ratings (within 1 point)
SELECT ut2.user_id, COUNT(*) as similar_tags
FROM user_tags ut1
JOIN user_tags ut2 ON ut1.tag_key = ut2.tag_key
WHERE ut1.user_id = 'current-user-id'
  AND ut2.user_id != 'current-user-id'
  AND ABS(ut1.numeric_value - ut2.numeric_value) <= 1
GROUP BY ut2.user_id
ORDER BY similar_tags DESC;

-- Find users with opposite preferences
SELECT ut2.user_id, COUNT(*) as opposite_tags
FROM user_tags ut1
JOIN user_tags ut2 ON ut1.tag_key = ut2.tag_key
WHERE ut1.user_id = 'current-user-id'
  AND ut2.user_id != 'current-user-id'
  AND ut1.data_type = 'boolean'
  AND ut1.numeric_value != ut2.numeric_value
GROUP BY ut2.user_id
ORDER BY opposite_tags DESC;
```

### Strategy 3: Semantic Profiles

**Concept:** Create high-level profile dimensions from quiz results

**Implementation:**
```typescript
// Add to database schema
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).unique(),
  
  // Aggregated dimensions (calculated from quiz results)
  leadershipScore: integer("leadership_score"),      // 0-100
  analyticalScore: integer("analytical_score"),      // 0-100
  creativityScore: integer("creativity_score"),      // 0-100
  collaborationScore: integer("collaboration_score"), // 0-100
  
  // Categorical preferences
  primaryInterest: text("primary_interest"),
  communicationStyle: text("communication_style"),
  workStyle: text("work_style"),
  
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Recalculate profile after each quiz completion
async function updateUserProfile(userId) {
  const allResults = await storage.getUserQuizResults(userId);
  
  // Aggregate scores across all quizzes
  let leadershipTotal = 0, leadershipCount = 0;
  
  for (const result of allResults) {
    // Extract leadership-related answers
    if (result.surveyResults['leadership-rating']) {
      leadershipTotal += result.surveyResults['leadership-rating'];
      leadershipCount++;
    }
  }
  
  const leadershipScore = leadershipCount > 0 
    ? Math.round((leadershipTotal / leadershipCount) * 20) // Scale to 100
    : null;
  
  await storage.updateUserProfile(userId, { leadershipScore });
}
```

**Discovery:**
```sql
-- Find users with similar overall profiles
SELECT user_id,
  ABS(leadership_score - 75) + 
  ABS(analytical_score - 80) +
  ABS(creativity_score - 60) AS profile_distance
FROM user_profiles
WHERE user_id != 'current-user-id'
ORDER BY profile_distance ASC
LIMIT 10;
```

---

## Recommended Implementation Plan

### Phase 1: Basic Same-Quiz Comparison
1. **Add discovery toggle** to user profile (opt-in)
2. **Create comparison API** that calculates similarity scores
3. **Build discovery page** showing users who took same quizzes
4. **Display match percentage** with breakdown by question

### Phase 2: Tag Extraction System
1. **Add `user_tags` table** to database schema
2. **Extract tags on quiz submit** from survey results
3. **Enable tag-based search** (find users with specific tags)
4. **Show common tags** between users

### Phase 3: Semantic Profiles
1. **Define profile dimensions** (leadership, creativity, etc.)
2. **Map quiz questions to dimensions**
3. **Calculate aggregate scores** from all quiz results
4. **Enable multi-dimensional matching**

---

## Database Schema Changes Needed

```typescript
// New table for user discovery preferences
export const userDiscoverySettings = pgTable("user_discovery_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id),
  isDiscoverable: boolean("is_discoverable").notNull().default(false),
  shareFullProfile: boolean("share_full_profile").notNull().default(false),
  shareSpecificQuizzes: varchar("share_specific_quizzes").array(), // Quiz IDs to share
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table for extracted tags (Strategy 2)
export const userTags = pgTable("user_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  tagKey: text("tag_key").notNull(),
  tagValue: text("tag_value").notNull(),
  dataType: text("data_type").notNull(), // "string" | "number" | "boolean"
  numericValue: integer("numeric_value"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userTagsIndex: index("idx_user_tags_user").on(table.userId),
  keyValueIndex: index("idx_user_tags_key_value").on(table.tagKey, table.tagValue),
}));

// New table for aggregated profiles (Strategy 3)
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // Add dimensions based on your quiz content
  leadershipScore: integer("leadership_score"),
  analyticalScore: integer("analytical_score"),
  creativityScore: integer("creativity_score"),
  primaryInterest: text("primary_interest"),
  communicationStyle: text("communication_style"),
  profileData: jsonb("profile_data"), // Flexible for additional dimensions
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

## Example API Endpoints

```typescript
// GET /api/discovery/similar
// Find users similar to current user
app.get("/api/discovery/similar", isAuthenticated, async (req, res) => {
  const userId = req.user.claims.sub;
  const { quizId, limit = 10 } = req.query;
  
  // Get current user's results for specific quiz
  const myResult = await storage.getUserQuizResult(userId, quizId);
  
  // Get all other discoverable users who took same quiz
  const otherUsers = await storage.getDiscoverableUsersByQuiz(quizId);
  
  // Calculate similarity scores
  const matches = otherUsers.map(user => ({
    userId: user.userId,
    name: user.name,
    similarity: calculateSimilarity(myResult, user.result, quiz),
    commonAnswers: getCommonAnswers(myResult, user.result)
  }));
  
  // Sort by similarity and return top matches
  return res.json(matches.sort((a, b) => b.similarity - a.similarity).slice(0, limit));
});

// GET /api/discovery/opposite
// Find users with opposite/complementary results
app.get("/api/discovery/opposite", isAuthenticated, async (req, res) => {
  // Similar to above, but sort by lowest similarity or specific opposites
});

// GET /api/discovery/by-tag
// Find users with specific tags
app.get("/api/discovery/by-tag", isAuthenticated, async (req, res) => {
  const { tagKey, tagValue } = req.query;
  
  const users = await storage.getUsersByTag(tagKey, tagValue);
  return res.json(users);
});
```

---

## Conclusion

The SurveyJS result structure is **excellent** for user discovery because:

✅ **Granular** - Every question/answer is accessible  
✅ **Flexible** - Works with any quiz type  
✅ **Type-safe** - Preserves different data types  
✅ **Scalable** - Can add tag extraction without changing core structure  
✅ **Privacy-friendly** - Easy to filter which results to share  

**Recommendation:** Start with Strategy 1 (same-quiz comparison) for MVP, then layer on Strategy 2 (tags) for more advanced discovery features.
