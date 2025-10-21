import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export type UserRole = "admin" | "facilitator" | "contributor" | "viewer";

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

// Quizzes table with JSON structure
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  courseId: varchar("course_id").references(() => courses.id, { onDelete: "set null" }),
  // Quiz mode: "take" (only take quiz), "upload" (only upload results), "both"
  mode: text("mode").notNull().default("take"),
  // Questions stored as JSON array
  questions: jsonb("questions").notNull().$type<QuizQuestion[]>(),
  // Quiz settings
  timeLimit: integer("time_limit"), // in minutes, null = no limit
  passingScore: integer("passing_score"), // percentage, null = no passing requirement
  allowRetakes: boolean("allow_retakes").notNull().default(true),
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  isPublished: boolean("is_published").notNull().default(false),
});

// Quiz results table
export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Result data
  answers: jsonb("answers").notNull().$type<QuizAnswer[]>(),
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
}).extend({
  mode: z.enum(["take", "upload", "both"]),
  questions: z.array(z.object({
    id: z.number(),
    question: z.string(),
    type: z.enum(["multiple_choice", "true_false", "short_answer"]),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.number(), z.null()]).optional(),
    points: z.number().optional(),
  })),
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
}).extend({
  answers: z.array(z.object({
    questionId: z.number(),
    answer: z.union([z.string(), z.number()]),
    isCorrect: z.boolean().optional(),
  })),
});

export const insertQuizProgressSchema = createInsertSchema(quizProgress).omit({
  id: true,
  startedAt: true,
  lastUpdatedAt: true,
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

export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;

export type InsertQuizProgress = z.infer<typeof insertQuizProgressSchema>;
export type QuizProgressType = typeof quizProgress.$inferSelect;
