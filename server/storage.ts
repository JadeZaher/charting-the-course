import { db } from "./db";
import { 
  users, teams, teamMembers, courses, quizzes, quizAssignments, quizResults, quizProgress,
  userTags, userBadges, userPrivacySettings, userProfileData,
  type User, type InsertUser, type UpsertUser,
  type Team, type InsertTeam,
  type Course, type InsertCourse,
  type Quiz, type InsertQuiz,
  type QuizAssignment, type InsertQuizAssignment,
  type QuizResult, type InsertQuizResult,
  type QuizProgressType, type InsertQuizProgress,
  type UserTag, type InsertUserTag,
  type UserBadge, type InsertUserBadge,
  type UserPrivacySettings, type InsertUserPrivacySettings,
  type UserProfileData, type InsertUserProfileData,
  type UserRole,
  type LocationData,
  type ContactData
} from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (Replit Auth required)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Additional user operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: UserRole): Promise<User | undefined>;
  updateUserLocationData(id: string, locationData: LocationData): Promise<User | undefined>;
  updateUserContactData(id: string, contactData: ContactData): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Team operations
  getAllTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: string): Promise<void>;
  
  // Team member operations
  addTeamMember(teamId: string, userId: string): Promise<void>;
  removeTeamMember(teamId: string, userId: string): Promise<void>;
  getTeamMembers(teamId: string): Promise<User[]>;
  getUserTeams(userId: string): Promise<Team[]>;
  
  // Course operations
  getAllCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  getCoursesByTeam(teamId: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;
  
  // Quiz operations
  getAllQuizzes(): Promise<Quiz[]>;
  getPublishedQuizzes(): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getQuizzesByCourse(courseId: string): Promise<Quiz[]>;
  getQuizzesForUser(userId: string): Promise<Quiz[]>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<void>;
  publishQuiz(id: string): Promise<Quiz | undefined>;
  
  // Quiz assignment operations
  createQuizAssignment(assignment: InsertQuizAssignment): Promise<QuizAssignment>;
  getQuizAssignments(quizId: string): Promise<QuizAssignment[]>;
  getUserQuizAssignments(userId: string): Promise<QuizAssignment[]>;
  deleteQuizAssignment(id: string): Promise<void>;
  
  // Quiz result operations
  getQuizResults(quizId: string): Promise<QuizResult[]>;
  getUserQuizResults(userId: string): Promise<QuizResult[]>;
  getUserQuizResult(userId: string, quizId: string): Promise<QuizResult | undefined>;
  getPreviousQuizResults(userId: string, quizId: string, excludeResultId: string): Promise<QuizResult[]>;
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  
  // Quiz progress operations
  getQuizProgress(userId: string, quizId: string): Promise<QuizProgressType | undefined>;
  saveQuizProgress(progress: InsertQuizProgress): Promise<QuizProgressType>;
  updateQuizProgress(userId: string, quizId: string, updates: Partial<InsertQuizProgress>): Promise<QuizProgressType | undefined>;
  deleteQuizProgress(userId: string, quizId: string): Promise<void>;
  
  // User tag operations
  createUserTags(tags: InsertUserTag[]): Promise<UserTag[]>;
  getUserTags(userId: string): Promise<UserTag[]>;
  getUserTagsByQuizResult(quizResultId: string): Promise<UserTag[]>;
  deleteUserTagsByQuizResult(quizResultId: string): Promise<void>;
  
  // User badge operations
  createUserBadge(badge: InsertUserBadge): Promise<UserBadge>;
  upsertUserBadge(badge: InsertUserBadge): Promise<UserBadge>;
  getUserBadges(userId: string): Promise<UserBadge[]>;
  deleteUserBadge(userId: string, badgeKey: string): Promise<void>;
  
  // User privacy settings operations
  getUserPrivacySettings(userId: string): Promise<UserPrivacySettings | undefined>;
  createOrUpdatePrivacySettings(settings: InsertUserPrivacySettings): Promise<UserPrivacySettings>;
  
  // User profile data operations
  getUserProfileData(userId: string): Promise<UserProfileData | undefined>;
  createOrUpdateProfileData(data: InsertUserProfileData): Promise<UserProfileData>;
}

export class DbStorage implements IStorage {
  // User operations (Replit Auth required)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate a UUID for the user ID since it's not auto-generated
    const { randomUUID } = await import('crypto');
    const [user] = await db.insert(users).values({
      ...insertUser,
      id: randomUUID(),
    }).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserRole(id: string, role: UserRole): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserLocationData(id: string, locationData: LocationData): Promise<User | undefined> {
    const [user] = await db.update(users).set({ locationData }).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserContactData(id: string, contactData: ContactData): Promise<User | undefined> {
    const [user] = await db.update(users).set({ contactData }).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Team operations
  async getAllTeams(): Promise<Team[]> {
    return await db.select().from(teams).orderBy(teams.createdAt);
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return team;
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async updateTeam(id: string, updates: Partial<InsertTeam>): Promise<Team | undefined> {
    const [team] = await db.update(teams).set(updates).where(eq(teams.id, id)).returning();
    return team;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Team member operations
  async addTeamMember(teamId: string, userId: string): Promise<void> {
    // Use onConflictDoNothing to handle duplicate memberships gracefully
    await db.insert(teamMembers).values({ teamId, userId }).onConflictDoNothing();
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    await db.delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
  }

  async getTeamMembers(teamId: string): Promise<User[]> {
    const members = await db
      .select({ user: users })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
    return members.map(m => m.user);
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const userTeams = await db
      .select({ team: teams })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));
    return userTeams.map(t => t.team);
  }

  // Course operations
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses).orderBy(courses.createdAt);
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return course;
  }

  async getCoursesByTeam(teamId: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.teamId, teamId));
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(insertCourse).returning();
    return course;
  }

  async updateCourse(id: string, updates: Partial<InsertCourse>): Promise<Course | undefined> {
    const [course] = await db.update(courses).set(updates).where(eq(courses.id, id)).returning();
    return course;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Quiz operations
  async getAllQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  }

  async getPublishedQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes)
      .where(eq(quizzes.isPublished, true))
      .orderBy(desc(quizzes.createdAt));
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    return quiz;
  }

  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.courseId, courseId));
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(insertQuiz).returning();
    return quiz;
  }

  async updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [quiz] = await db.update(quizzes).set(updates).where(eq(quizzes.id, id)).returning();
    return quiz;
  }

  async deleteQuiz(id: string): Promise<void> {
    await db.delete(quizzes).where(eq(quizzes.id, id));
  }

  async publishQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.update(quizzes)
      .set({ isPublished: true })
      .where(eq(quizzes.id, id))
      .returning();
    return quiz;
  }

  async getQuizzesForUser(userId: string): Promise<Quiz[]> {
    // Get user's team memberships
    const userTeams = await this.getUserTeams(userId);
    const teamIds = userTeams.map(t => t.id);

    // Get quizzes that are:
    // 1. Public and published
    // 2. Team-based where user is a team member
    // 3. Assigned directly to the user
    const publicQuizzes = await db.select().from(quizzes)
      .where(and(
        eq(quizzes.visibility, 'public'),
        eq(quizzes.isPublished, true)
      ));

    const teamQuizzes = teamIds.length > 0 
      ? await db.select().from(quizzes)
          .where(and(
            eq(quizzes.visibility, 'team'),
            eq(quizzes.isPublished, true)
          ))
      : [];

    const assignedQuizResults = await db.select({ quiz: quizzes })
      .from(quizAssignments)
      .innerJoin(quizzes, eq(quizAssignments.quizId, quizzes.id))
      .where(and(
        eq(quizAssignments.userId, userId),
        eq(quizzes.isPublished, true)
      ));

    const assignedQuizzes = assignedQuizResults.map(r => r.quiz);

    // Combine and deduplicate
    const allQuizzes = [...publicQuizzes, ...teamQuizzes, ...assignedQuizzes];
    const uniqueQuizzes = Array.from(
      new Map(allQuizzes.map(q => [q.id, q])).values()
    );

    return uniqueQuizzes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Quiz assignment operations
  async createQuizAssignment(insertAssignment: InsertQuizAssignment): Promise<QuizAssignment> {
    const [assignment] = await db.insert(quizAssignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async getQuizAssignments(quizId: string): Promise<QuizAssignment[]> {
    return await db.select().from(quizAssignments)
      .where(eq(quizAssignments.quizId, quizId))
      .orderBy(desc(quizAssignments.createdAt));
  }

  async getUserQuizAssignments(userId: string): Promise<QuizAssignment[]> {
    return await db.select().from(quizAssignments)
      .where(eq(quizAssignments.userId, userId))
      .orderBy(desc(quizAssignments.createdAt));
  }

  async deleteQuizAssignment(id: string): Promise<void> {
    await db.delete(quizAssignments).where(eq(quizAssignments.id, id));
  }

  // Quiz result operations
  async getQuizResults(quizId: string): Promise<QuizResult[]> {
    return await db.select().from(quizResults)
      .where(eq(quizResults.quizId, quizId))
      .orderBy(desc(quizResults.completedAt));
  }

  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return await db.select().from(quizResults)
      .where(eq(quizResults.userId, userId))
      .orderBy(desc(quizResults.completedAt));
  }

  async getUserQuizResult(userId: string, quizId: string): Promise<QuizResult | undefined> {
    const [result] = await db.select().from(quizResults)
      .where(and(eq(quizResults.userId, userId), eq(quizResults.quizId, quizId)))
      .orderBy(desc(quizResults.completedAt))
      .limit(1);
    return result;
  }

  async getPreviousQuizResults(userId: string, quizId: string, excludeResultId: string): Promise<QuizResult[]> {
    return await db.select().from(quizResults)
      .where(
        and(
          eq(quizResults.userId, userId),
          eq(quizResults.quizId, quizId),
          sql`${quizResults.id} != ${excludeResultId}`
        )
      )
      .orderBy(desc(quizResults.completedAt));
  }

  async createQuizResult(insertResult: InsertQuizResult): Promise<QuizResult> {
    const [result] = await db.insert(quizResults).values(insertResult).returning();
    return result;
  }

  // Quiz progress operations
  async getQuizProgress(userId: string, quizId: string): Promise<QuizProgressType | undefined> {
    const [progress] = await db.select().from(quizProgress)
      .where(and(eq(quizProgress.userId, userId), eq(quizProgress.quizId, quizId)))
      .limit(1);
    return progress;
  }

  async saveQuizProgress(insertProgress: InsertQuizProgress): Promise<QuizProgressType> {
    // Use upsert to handle duplicate (userId, quizId) gracefully
    // Type assertion needed due to Drizzle JSONB type inference limitations
    const [progress] = await db.insert(quizProgress)
      .values(insertProgress as any)
      .onConflictDoUpdate({
        target: [quizProgress.userId, quizProgress.quizId],
        set: {
          currentQuestionIndex: sql`EXCLUDED.current_question_index`,
          answers: sql`EXCLUDED.answers`,
          lastUpdatedAt: sql`EXCLUDED.last_updated_at`,
        }
      })
      .returning();
    return progress;
  }

  async updateQuizProgress(userId: string, quizId: string, updates: Partial<InsertQuizProgress>): Promise<QuizProgressType | undefined> {
    // Type assertion needed due to Drizzle JSONB type inference limitations
    const [progress] = await db.update(quizProgress)
      .set({ ...updates, lastUpdatedAt: new Date() } as any)
      .where(and(eq(quizProgress.userId, userId), eq(quizProgress.quizId, quizId)))
      .returning();
    return progress;
  }

  async deleteQuizProgress(userId: string, quizId: string): Promise<void> {
    await db.delete(quizProgress)
      .where(and(eq(quizProgress.userId, userId), eq(quizProgress.quizId, quizId)));
  }

  // User tag operations
  async createUserTags(tags: InsertUserTag[]): Promise<UserTag[]> {
    if (tags.length === 0) return [];
    const results = await db.insert(userTags).values(tags as any).returning();
    return results;
  }

  async getUserTags(userId: string): Promise<UserTag[]> {
    return await db.select().from(userTags)
      .where(eq(userTags.userId, userId))
      .orderBy(desc(userTags.createdAt));
  }

  async getUserTagsByQuizResult(quizResultId: string): Promise<UserTag[]> {
    return await db.select().from(userTags)
      .where(eq(userTags.quizResultId, quizResultId));
  }

  async deleteUserTagsByQuizResult(quizResultId: string): Promise<void> {
    await db.delete(userTags).where(eq(userTags.quizResultId, quizResultId));
  }

  // User badge operations
  async createUserBadge(insertBadge: InsertUserBadge): Promise<UserBadge> {
    const [badge] = await db.insert(userBadges).values(insertBadge as any).returning();
    return badge;
  }

  async upsertUserBadge(insertBadge: InsertUserBadge): Promise<UserBadge> {
    const [badge] = await db.insert(userBadges)
      .values(insertBadge as any)
      .onConflictDoUpdate({
        target: [userBadges.userId, userBadges.badgeKey],
        set: {
          badgeName: sql`EXCLUDED.badge_name`,
          badgeDescription: sql`EXCLUDED.badge_description`,
          badgeCategory: sql`EXCLUDED.badge_category`,
          badgeIcon: sql`EXCLUDED.badge_icon`,
          strength: sql`user_badges.strength + 1`, // Increment strength when badge is re-earned
          sourceTagKeys: sql`EXCLUDED.source_tag_keys`,
          updatedAt: sql`EXCLUDED.updated_at`,
        }
      })
      .returning();
    return badge;
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db.select().from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
  }

  async deleteUserBadge(userId: string, badgeKey: string): Promise<void> {
    await db.delete(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, badgeKey)));
  }

  // User privacy settings operations
  async getUserPrivacySettings(userId: string): Promise<UserPrivacySettings | undefined> {
    const [settings] = await db.select().from(userPrivacySettings)
      .where(eq(userPrivacySettings.userId, userId))
      .limit(1);
    return settings;
  }

  async createOrUpdatePrivacySettings(insertSettings: InsertUserPrivacySettings): Promise<UserPrivacySettings> {
    const [settings] = await db.insert(userPrivacySettings)
      .values(insertSettings as any)
      .onConflictDoUpdate({
        target: userPrivacySettings.userId,
        set: {
          ...insertSettings,
          updatedAt: new Date(),
        }
      })
      .returning();
    return settings;
  }

  // User profile data operations
  async getUserProfileData(userId: string): Promise<UserProfileData | undefined> {
    const [data] = await db.select().from(userProfileData)
      .where(eq(userProfileData.userId, userId))
      .limit(1);
    return data;
  }

  async createOrUpdateProfileData(insertData: InsertUserProfileData): Promise<UserProfileData> {
    const [data] = await db.insert(userProfileData)
      .values(insertData as any)
      .onConflictDoUpdate({
        target: userProfileData.userId,
        set: {
          profileDimensions: sql`EXCLUDED.profile_dimensions`,
          totalQuizzesCompleted: sql`EXCLUDED.total_quizzes_completed`,
          totalTagsEarned: sql`EXCLUDED.total_tags_earned`,
          totalBadgesEarned: sql`EXCLUDED.total_badges_earned`,
          lastCalculatedAt: sql`EXCLUDED.last_calculated_at`,
          updatedAt: sql`now()`,
        }
      })
      .returning();
    return data;
  }
}

export const storage = new DbStorage();
