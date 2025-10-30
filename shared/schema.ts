import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export type UserRole = "admin" | "facilitator" | "contributor" | "viewer";

// Location data structure
export type LocationData = {
  continentsVisited?: string[];
  travelFrequency?: string;
  travelMotivation?: string[];
  locationPrivacy?: string;
  identitySensitivity?: string;
  meetupPreferences?: string[];
  communityActivities?: string[];
} & Record<string, any>;

// Contact data structure
export type ContactData = {
  preferredMethods?: string[];
  communicationStyle?: string;
  responseTime?: string;
  energizingMethods?: string[];
  drainingMethods?: string[];
  boundaries?: string[];
  privacyLevel?: string;
} & Record<string, any>;

// Zod validation schemas for location and contact data
export const locationDataSchema = z.object({
  continentsVisited: z.array(z.string()).optional(),
  travelFrequency: z.string().optional(),
  travelMotivation: z.array(z.string()).optional(),
  locationPrivacy: z.string().optional(),
  identitySensitivity: z.string().optional(),
  meetupPreferences: z.array(z.string()).optional(),
  communityActivities: z.array(z.string()).optional(),
}).passthrough();

export const contactDataSchema = z.object({
  preferredMethods: z.array(z.string()).optional(),
  communicationStyle: z.string().optional(),
  responseTime: z.string().optional(),
  energizingMethods: z.array(z.string()).optional(),
  drainingMethods: z.array(z.string()).optional(),
  boundaries: z.array(z.string()).optional(),
  privacyLevel: z.string().optional(),
}).passthrough();

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - integrated with Replit Auth
// Note: id is set from Replit's sub claim during login via upsertUser
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  // Replit Auth fields
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Additional profile fields
  username: text("username"),
  bio: text("bio"),
  // Location and contact data (from quizzes or manual entry)
  locationData: jsonb("location_data").$type<LocationData>(),
  contactData: jsonb("contact_data").$type<ContactData>(),
  // Role and permissions
  role: text("role").notNull().default("viewer").$type<UserRole>(),
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Team members junction table
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTeamUser: uniqueIndex("team_members_team_user_uniq").on(table.teamId, table.userId),
}));

// Courses table
export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Visibility types for quizzes
export type QuizVisibility = "public" | "private" | "team" | "assigned";

// Quizzes table with JSON structure
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: "set null" }),
  // Quiz mode: "take" (only take quiz), "upload" (only upload results), "both"
  mode: text("mode").notNull().default("take"),
  // SurveyJS complete survey definition stored as JSON
  surveyJson: jsonb("survey_json").notNull(),
  // Deprecated: Legacy questions field (keeping for migration compatibility)
  questions: jsonb("questions").$type<QuizQuestion[]>(),
  // Quiz settings
  timeLimit: integer("time_limit"), // in minutes, null = no limit
  passingScore: integer("passing_score"), // percentage, null = no passing requirement
  allowRetakes: boolean("allow_retakes").notNull().default(true),
  // Visibility and permissions
  visibility: text("visibility").notNull().default("public").$type<QuizVisibility>(),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "set null" }),
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  isPublished: boolean("is_published").notNull().default(false),
});

// Quiz assignments table (who can take which quizzes)
export const quizAssignments = pgTable("quiz_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").references(() => users.id),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  quizUserUniq: uniqueIndex("quiz_assignments_quiz_user_uniq").on(table.quizId, table.userId),
}));

// Quiz results table
export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Result data - stores full SurveyJS results
  surveyResults: jsonb("survey_results").notNull(),
  // Deprecated: Legacy answers field (keeping for migration compatibility)
  answers: jsonb("answers").$type<QuizAnswer[]>(),
  score: integer("score").notNull(), // percentage
  isPassed: boolean("is_passed"),
  timeSpent: integer("time_spent"), // in seconds
  // Import metadata (if uploaded via JSON)
  isImported: boolean("is_imported").notNull().default(false),
  importedData: jsonb("imported_data"),
  // Metadata
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// Quiz progress table (for in-progress quizzes)
export const quizProgress = pgTable("quiz_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  answers: jsonb("answers").notNull().$type<QuizAnswer[]>().default(sql`'[]'::jsonb`),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserQuiz: uniqueIndex("quiz_progress_user_quiz_uniq").on(table.userId, table.quizId),
}));

// User tags table - stores individual tags extracted from quiz results
export const userTags = pgTable("user_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizResultId: varchar("quiz_result_id").notNull().references(() => quizResults.id, { onDelete: "cascade" }),
  // Tag information
  tagKey: text("tag_key").notNull(),        // e.g., "leadership-style", "communication-preference"
  tagValue: text("tag_value").notNull(),    // e.g., "collaborative", "visual"
  tagCategory: text("tag_category"),        // e.g., "personality", "skills", "interests"
  // Data type and numeric representation for similarity matching
  dataType: text("data_type").notNull().$type<"string" | "number" | "boolean">(),
  numericValue: integer("numeric_value"),   // For ratings and numeric answers
  // Source metadata
  questionName: text("question_name"),      // Original SurveyJS question name
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userTagsUserIndex: index("idx_user_tags_user").on(table.userId),
  userTagsKeyIndex: index("idx_user_tags_key").on(table.tagKey),
  userTagsKeyValueIndex: index("idx_user_tags_key_value").on(table.tagKey, table.tagValue),
}));

// User badges table - consolidated/aggregated badges from tags
export const userBadges = pgTable("user_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Badge definition
  badgeKey: text("badge_key").notNull(),           // e.g., "collaborative-leader"
  badgeName: text("badge_name").notNull(),         // e.g., "Collaborative Leader"
  badgeDescription: text("badge_description"),
  badgeCategory: text("badge_category"),           // e.g., "personality", "skills", "values"
  badgeIcon: text("badge_icon"),                   // Icon name or emoji
  // Badge strength/level (how many supporting tags)
  strength: integer("strength").notNull().default(1),
  // Source tracking
  sourceTagKeys: text("source_tag_keys").array(),  // Which tags triggered this badge
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userBadgesUserIndex: index("idx_user_badges_user").on(table.userId),
  userBadgesKeyIndex: index("idx_user_badges_key").on(table.badgeKey),
  uniqueUserBadge: uniqueIndex("user_badges_user_key_uniq").on(table.userId, table.badgeKey),
}));

// User privacy settings - controls what's visible publicly
export const userPrivacySettings = pgTable("user_privacy_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // Public profile controls
  isProfilePublic: boolean("is_profile_public").notNull().default(false),
  showBadges: boolean("show_badges").notNull().default(false),
  showQuizResults: boolean("show_quiz_results").notNull().default(false),
  showTags: boolean("show_tags").notNull().default(false),
  // Specific profile dimensions to share
  sharedDimensions: text("shared_dimensions").array(), // e.g., ["personality", "interests"]
  // Discovery settings
  allowDiscovery: boolean("allow_discovery").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User profile data - flexible storage for profile dimensions and metadata
export const userProfileData = pgTable("user_profile_data", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  // Profile dimensions (calculated from tags and badges)
  profileDimensions: jsonb("profile_dimensions").$type<ProfileDimensions>(),
  // Summary statistics
  totalQuizzesCompleted: integer("total_quizzes_completed").notNull().default(0),
  totalTagsEarned: integer("total_tags_earned").notNull().default(0),
  totalBadgesEarned: integer("total_badges_earned").notNull().default(0),
  // Metadata
  lastCalculatedAt: timestamp("last_calculated_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TypeScript types for JSON fields
export interface QuizQuestion {
  id: number;
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correctAnswer?: string | number | null; // null for questions without "correct" answer (e.g., style assessments)
  points?: number;
}

export interface QuizAnswer {
  questionId: number;
  answer: string | number;
  isCorrect?: boolean;
}

// Profile dimensions interface - flexible structure for profile cards
export interface ProfileDimensions {
  personality?: {
    communicationStyle?: string;
    leadershipStyle?: string;
    decisionMaking?: string;
    workPace?: string;
    [key: string]: any;
  };
  strengths?: {
    topStrengths?: string[];
    skillRatings?: Record<string, number>;
    competencies?: string[];
    [key: string]: any;
  };
  values?: {
    coreValues?: string[];
    motivations?: string[];
    priorities?: string[];
    [key: string]: any;
  };
  interests?: {
    primaryInterest?: string;
    topics?: string[];
    learningPreferences?: string[];
    [key: string]: any;
  };
  growth?: {
    areasForGrowth?: string[];
    learningGoals?: string[];
    developmentPaths?: string[];
    [key: string]: any;
  };
  [key: string]: any; // Allow additional dimensions
}

// Zod schemas for validation
// Schema for user creation (NEVER accept role from client - set server-side only)
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
  role: true, // SECURITY: Role must be set server-side, not from client input
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  questions: true, // deprecated field
}).extend({
  mode: z.enum(["take", "upload", "both"]),
  visibility: z.enum(["public", "private", "team", "assigned"]),
  surveyJson: z.record(z.any()), // SurveyJS JSON schema
});

export const insertQuizAssignmentSchema = createInsertSchema(quizAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
  answers: true, // deprecated field
}).extend({
  surveyResults: z.record(z.any()), // SurveyJS results object
});

export const insertQuizProgressSchema = createInsertSchema(quizProgress).omit({
  id: true,
  startedAt: true,
  lastUpdatedAt: true,
});

export const insertUserTagSchema = createInsertSchema(userTags).omit({
  id: true,
  createdAt: true,
}).extend({
  dataType: z.enum(["string", "number", "boolean"]),
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
  updatedAt: true,
});

export const insertUserPrivacySettingsSchema = createInsertSchema(userPrivacySettings).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileDataSchema = createInsertSchema(userProfileData).omit({
  lastCalculatedAt: true,
  updatedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

export type InsertQuizAssignment = z.infer<typeof insertQuizAssignmentSchema>;
export type QuizAssignment = typeof quizAssignments.$inferSelect;

export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;

export type InsertQuizProgress = z.infer<typeof insertQuizProgressSchema>;
export type QuizProgressType = typeof quizProgress.$inferSelect;

export type InsertUserTag = z.infer<typeof insertUserTagSchema>;
export type UserTag = typeof userTags.$inferSelect;

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

export type InsertUserPrivacySettings = z.infer<typeof insertUserPrivacySettingsSchema>;
export type UserPrivacySettings = typeof userPrivacySettings.$inferSelect;

export type InsertUserProfileData = z.infer<typeof insertUserProfileDataSchema>;
export type UserProfileData = typeof userProfileData.$inferSelect;
