import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertQuizSchema, 
  insertQuizResultSchema, 
  insertQuizProgressSchema,
  locationDataSchema,
  contactDataSchema,
  type Quiz
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Helper: Check if user has admin or facilitator role
  const isAdminOrFacilitator = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== "admin" && user.role !== "facilitator")) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization check failed" });
    }
  };

  // Helper: Check if user has admin role
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization check failed" });
    }
  };

  // Helper: Redact correct answers from quiz for non-privileged users
  const redactQuizAnswers = (quiz: Quiz): Quiz => {
    // For SurveyJS quizzes, redact correctAnswer from surveyJson
    if (quiz.surveyJson && typeof quiz.surveyJson === 'object') {
      const redactedSurveyJson = JSON.parse(JSON.stringify(quiz.surveyJson));
      if (redactedSurveyJson.pages) {
        redactedSurveyJson.pages.forEach((page: any) => {
          if (page.elements) {
            page.elements.forEach((element: any) => {
              delete element.correctAnswer;
            });
          }
        });
      }
      return { ...quiz, surveyJson: redactedSurveyJson };
    }
    
    // Legacy support for old question format
    if (quiz.questions && Array.isArray(quiz.questions)) {
      return {
        ...quiz,
        questions: quiz.questions.map(q => ({
          ...q,
          correctAnswer: undefined,
        })),
      };
    }
    
    return quiz;
  };

  // Helper: Calculate quiz score
  const calculateScore = (quiz: any, answers: any[]): { score: number; isPassed: boolean; gradedAnswers: any[] } => {
    if (!quiz.questions || quiz.questions.length === 0) {
      return { score: 0, isPassed: false, gradedAnswers: [] };
    }

    // Count only gradable questions (those with correct answers)
    const gradableQuestions = quiz.questions.filter((q: any) => 
      q.correctAnswer !== null && q.correctAnswer !== undefined
    );

    let correctCount = 0;
    const gradedAnswers = answers.map(answer => {
      const question = quiz.questions.find((q: any) => q.id === answer.questionId);
      if (!question) {
        return { ...answer, isCorrect: false };
      }

      // Skip grading if no correct answer defined (e.g., style assessments)
      if (question.correctAnswer === null || question.correctAnswer === undefined) {
        return { ...answer, isCorrect: undefined };
      }

      // Convert both to strings for comparison
      const userAnswer = String(answer.answer).trim().toLowerCase();
      const correctAnswer = String(question.correctAnswer).trim().toLowerCase();
      const isCorrect = userAnswer === correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      return { ...answer, isCorrect };
    });

    // Calculate score based only on gradable questions
    const score = gradableQuestions.length > 0 
      ? Math.round((correctCount / gradableQuestions.length) * 100)
      : 0;
    const isPassed = quiz.passingScore ? score >= quiz.passingScore : true;

    return { score, isPassed, gradedAnswers };
  };

  // Quiz routes
  // GET /api/quizzes - Get all quizzes (published only for non-admins/facilitators)
  app.get("/api/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const isPrivileged = user && (user.role === "admin" || user.role === "facilitator");
      
      let quizzes;
      if (isPrivileged) {
        quizzes = await storage.getAllQuizzes();
      } else {
        quizzes = await storage.getPublishedQuizzes();
        // Redact correct answers for non-privileged users
        quizzes = quizzes.map(quiz => redactQuizAnswers(quiz));
      }
      
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  // GET /api/quizzes/:id - Get a specific quiz
  app.get("/api/quizzes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const isPrivileged = user && (user.role === "admin" || user.role === "facilitator");
      
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Check access: unpublished quizzes only visible to admin/facilitator
      if (!quiz.isPublished && !isPrivileged) {
        return res.status(403).json({ message: "Access denied to unpublished quiz" });
      }

      // Redact correct answers for non-privileged users
      const responseQuiz = isPrivileged ? quiz : redactQuizAnswers(quiz);
      res.json(responseQuiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // POST /api/quizzes - Create a new quiz (admin/facilitator only)
  app.post("/api/quizzes", isAuthenticated, isAdminOrFacilitator, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validation = insertQuizSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid quiz data",
          errors: fromZodError(validation.error).toString()
        });
      }

      // Server-side field whitelisting - ignore client-provided protected fields
      const quizData = {
        ...validation.data,
        createdBy: userId,
        isPublished: false, // Always start unpublished, use publish endpoint
      };
      
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ message: "Failed to create quiz" });
    }
  });

  // PATCH /api/quizzes/:id - Update a quiz (admin/facilitator only)
  app.patch("/api/quizzes/:id", isAuthenticated, isAdminOrFacilitator, async (req, res) => {
    try {
      // Validate request body (partial schema)
      const validation = insertQuizSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid quiz data",
          errors: fromZodError(validation.error).toString()
        });
      }

      // Server-side field whitelisting - ignore protected fields
      const { createdBy, isPublished, ...allowedUpdates } = validation.data;
      
      const quiz = await storage.updateQuiz(req.params.id, allowedUpdates);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  // DELETE /api/quizzes/:id - Delete a quiz (admin only)
  app.delete("/api/quizzes/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteQuiz(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  // POST /api/quizzes/:id/publish - Publish a quiz (admin/facilitator only)
  app.post("/api/quizzes/:id/publish", isAuthenticated, isAdminOrFacilitator, async (req, res) => {
    try {
      const quiz = await storage.publishQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error publishing quiz:", error);
      res.status(500).json({ message: "Failed to publish quiz" });
    }
  });

  // POST /api/quizzes/import - Import quiz from JSON (admin/facilitator only)
  app.post("/api/quizzes/import", isAuthenticated, isAdminOrFacilitator, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validation = insertQuizSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid quiz data",
          errors: fromZodError(validation.error).toString()
        });
      }

      const quizData = {
        ...validation.data,
        createdBy: userId,
        isPublished: false, // Imported quizzes start as unpublished
      };
      
      const quiz = await storage.createQuiz(quizData);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error importing quiz:", error);
      res.status(500).json({ message: "Failed to import quiz" });
    }
  });

  // POST /api/quizzes/:id/submit - Submit quiz answers and calculate score
  app.post("/api/quizzes/:id/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const quizId = req.params.id;

      // Validate request body
      const bodySchema = insertQuizResultSchema.pick({ surveyResults: true, timeSpent: true });
      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid submission data",
          errors: fromZodError(validation.error).toString()
        });
      }

      const { surveyResults, timeSpent } = validation.data;

      // Get the quiz
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Access control: Check if quiz is published or user is privileged
      const isPrivileged = user && (user.role === "admin" || user.role === "facilitator");
      if (!quiz.isPublished && !isPrivileged) {
        return res.status(403).json({ message: "Access denied to unpublished quiz" });
      }

      // Business rule: Check quiz mode
      if (quiz.mode === "upload") {
        return res.status(400).json({ 
          message: "This quiz is in upload-only mode. Please use the upload feature instead." 
        });
      }

      // Business rule: Check for existing results if retakes not allowed
      if (!quiz.allowRetakes) {
        const existingResult = await storage.getUserQuizResult(userId, quizId);
        if (existingResult) {
          return res.status(400).json({ 
            message: "You have already completed this quiz and retakes are not allowed." 
          });
        }
      }

      // Calculate score for SurveyJS quizzes
      let score = 0;
      let isPassed = true;
      let correctCount = 0;
      let totalQuestions = 0;
      
      // Extract questions from surveyJson and compare with user answers
      if (quiz.surveyJson && typeof quiz.surveyJson === 'object') {
        const surveyDef = quiz.surveyJson as any;
        
        // Iterate through all pages and elements to find questions with correct answers
        if (surveyDef.pages && Array.isArray(surveyDef.pages)) {
          for (const page of surveyDef.pages) {
            if (page.elements && Array.isArray(page.elements)) {
              for (const element of page.elements) {
                // Only grade questions that have a correctAnswer defined
                if (element.correctAnswer !== undefined && element.correctAnswer !== null) {
                  totalQuestions++;
                  const userAnswer = surveyResults[element.name];
                  
                  // Compare user answer with correct answer
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
        
        // Calculate score percentage
        score = totalQuestions > 0 
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;
      }
      
      // Check passing score
      if (quiz.passingScore) {
        isPassed = score >= quiz.passingScore;
      }

      // Save result
      const result = await storage.createQuizResult({
        quizId,
        userId,
        surveyResults,
        score,
        isPassed,
        timeSpent,
        isImported: false,
      });

      // Clean up tags from previous quiz attempts (retakes)
      // Keep quiz result history but remove old tags so only latest attempt affects profile
      const previousResults = await storage.getPreviousQuizResults(userId, quizId, result.id);
      for (const prevResult of previousResults) {
        await storage.deleteUserTagsByQuizResult(prevResult.id);
      }

      // Extract tags from quiz submission
      const { extractTagsFromQuizSubmission, determineBadgesFromTags } = await import('./tagExtraction');
      const extractedTags = extractTagsFromQuizSubmission(
        userId,
        result.id,
        quiz.surveyJson,
        surveyResults
      );

      // Save tags to database
      if (extractedTags.length > 0) {
        await storage.createUserTags(extractedTags);

        // Get all user tags to determine badges
        const allUserTags = await storage.getUserTags(userId);
        const badgesToEarn = determineBadgesFromTags(allUserTags);

        // Upsert badges (increment strength if already earned)
        for (const badge of badgesToEarn) {
          await storage.upsertUserBadge({
            userId,
            badgeKey: badge.badgeKey,
            badgeName: badge.badgeName,
            badgeDescription: badge.badgeDescription,
            badgeCategory: badge.badgeCategory,
            badgeIcon: badge.badgeIcon,
            strength: 1,
            sourceTagKeys: badge.sourceTagKeys,
          });
        }
      }

      // Populate locationData or contactData based on quiz type
      if (quizId.startsWith('location') || quizId.startsWith('locations')) {
        // Extract location data from survey results
        const locationData: any = {};
        if (surveyResults.continents_visited) locationData.continentsVisited = surveyResults.continents_visited;
        if (surveyResults.travel_frequency) locationData.travelFrequency = surveyResults.travel_frequency;
        if (surveyResults.travel_motivation) locationData.travelMotivation = surveyResults.travel_motivation;
        if (surveyResults.location_privacy) locationData.locationPrivacy = surveyResults.location_privacy;
        if (surveyResults.identity_sensitivity) locationData.identitySensitivity = surveyResults.identity_sensitivity;
        if (surveyResults.meetup_preferences) locationData.meetupPreferences = surveyResults.meetup_preferences;
        if (surveyResults.community_activities) locationData.communityActivities = surveyResults.community_activities;
        
        // Update user's locationData
        await storage.updateUserLocationData(userId, locationData);
      } else if (quizId.startsWith('contact')) {
        // Extract contact data from survey results
        const contactData: any = {};
        if (surveyResults.preferred_methods) contactData.preferredMethods = surveyResults.preferred_methods;
        if (surveyResults.communication_style) contactData.communicationStyle = surveyResults.communication_style;
        if (surveyResults.response_time) contactData.responseTime = surveyResults.response_time;
        if (surveyResults.energizing_methods) contactData.energizingMethods = surveyResults.energizing_methods;
        if (surveyResults.draining_methods) contactData.drainingMethods = surveyResults.draining_methods;
        if (surveyResults.boundaries) contactData.boundaries = surveyResults.boundaries;
        if (surveyResults.privacy_level) contactData.privacyLevel = surveyResults.privacy_level;
        
        // Update user's contactData
        await storage.updateUserContactData(userId, contactData);
      }

      // Delete quiz progress since it's completed
      await storage.deleteQuizProgress(userId, quizId);

      res.json(result);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  // GET /api/quiz-results/user - Get current user's quiz results
  app.get("/api/quiz-results/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getUserQuizResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching user quiz results:", error);
      res.status(500).json({ message: "Failed to fetch quiz results" });
    }
  });

  // GET /api/quiz-results/:quizId - Get user's result for a specific quiz
  app.get("/api/quiz-results/:quizId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.getUserQuizResult(userId, req.params.quizId);
      res.json(result || null);
    } catch (error) {
      console.error("Error fetching quiz result:", error);
      res.status(500).json({ message: "Failed to fetch quiz result" });
    }
  });

  // GET /api/quiz-progress/:quizId - Get user's progress for a quiz
  app.get("/api/quiz-progress/:quizId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getQuizProgress(userId, req.params.quizId);
      res.json(progress || null);
    } catch (error) {
      console.error("Error fetching quiz progress:", error);
      res.status(500).json({ message: "Failed to fetch quiz progress" });
    }
  });

  // POST /api/quiz-progress/:quizId - Save quiz progress
  app.post("/api/quiz-progress/:quizId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const quizId = req.params.quizId;

      // Validate request body
      const bodySchema = insertQuizProgressSchema.pick({ currentQuestionIndex: true, answers: true });
      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid progress data",
          errors: fromZodError(validation.error).toString()
        });
      }

      // Get the quiz and check access
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Access control: Check if quiz is published or user is privileged
      const isPrivileged = user && (user.role === "admin" || user.role === "facilitator");
      if (!quiz.isPublished && !isPrivileged) {
        return res.status(403).json({ message: "Access denied to unpublished quiz" });
      }

      const { currentQuestionIndex, answers } = validation.data;

      const progress = await storage.saveQuizProgress({
        userId,
        quizId,
        currentQuestionIndex,
        answers,
      });

      res.json(progress);
    } catch (error) {
      console.error("Error saving quiz progress:", error);
      res.status(500).json({ message: "Failed to save quiz progress" });
    }
  });

  // DELETE /api/quiz-progress/:quizId - Delete quiz progress
  app.delete("/api/quiz-progress/:quizId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const quizId = req.params.quizId;

      // Get the quiz and check access
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Access control: Check if quiz is published or user is privileged
      const isPrivileged = user && (user.role === "admin" || user.role === "facilitator");
      if (!quiz.isPublished && !isPrivileged) {
        return res.status(403).json({ message: "Access denied to unpublished quiz" });
      }

      await storage.deleteQuizProgress(userId, quizId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quiz progress:", error);
      res.status(500).json({ message: "Failed to delete quiz progress" });
    }
  });

  // POST /api/quiz-assignments - Create a quiz assignment (admin/facilitator only)
  app.post("/api/quiz-assignments", isAuthenticated, isAdminOrFacilitator, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quizId, userId: assignedUserId, teamId, dueDate } = req.body;

      if (!quizId || (!assignedUserId && !teamId)) {
        return res.status(400).json({ 
          message: "quizId and either userId or teamId are required" 
        });
      }

      const assignment = await storage.createQuizAssignment({
        quizId,
        userId: assignedUserId,
        teamId,
        assignedBy: userId,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating quiz assignment:", error);
      res.status(500).json({ message: "Failed to create quiz assignment" });
    }
  });

  // GET /api/quiz-assignments/user - Get current user's quiz assignments
  app.get("/api/quiz-assignments/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignments = await storage.getUserQuizAssignments(userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user quiz assignments:", error);
      res.status(500).json({ message: "Failed to fetch quiz assignments" });
    }
  });

  // GET /api/quiz-assignments/:quizId - Get assignments for a specific quiz (admin/facilitator only)
  app.get("/api/quiz-assignments/:quizId", isAuthenticated, isAdminOrFacilitator, async (req, res) => {
    try {
      const assignments = await storage.getQuizAssignments(req.params.quizId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching quiz assignments:", error);
      res.status(500).json({ message: "Failed to fetch quiz assignments" });
    }
  });

  // DELETE /api/quiz-assignments/:id - Delete a quiz assignment (admin/facilitator only)
  app.delete("/api/quiz-assignments/:id", isAuthenticated, isAdminOrFacilitator, async (req, res) => {
    try {
      await storage.deleteQuizAssignment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting quiz assignment:", error);
      res.status(500).json({ message: "Failed to delete quiz assignment" });
    }
  });

  // Profile endpoints
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user info
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Get privacy settings first to determine what to show
      const privacy = await storage.getUserPrivacySettings(userId);
      
      // Check if requester is the owner (authenticated users only)
      const isOwner = (req as any).user?.claims?.sub === userId;
      
      // If not the owner and profile is not public, return minimal data
      if (!isOwner && privacy && !privacy.isProfilePublic) {
        return res.json({
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          },
          profileData: null,
          badges: [],
          tags: [],
          privacy: null,
        });
      }
      
      // Get profile data
      const profileData = await storage.getUserProfileData(userId);
      
      // Get user badges (only if privacy allows)
      const badges = (isOwner || privacy?.showBadges) 
        ? await storage.getUserBadges(userId) 
        : [];
      
      // Get user tags (only if privacy allows)
      const tags = (isOwner || privacy?.showTags) 
        ? await storage.getUserTags(userId) 
        : [];
      
      const response = {
        user: {
          id: user.id,
          email: (isOwner || privacy?.isProfilePublic) ? user.email : undefined,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          bio: user.bio,
          role: user.role,
          createdAt: user.createdAt,
        },
        profileData: isOwner || privacy?.isProfilePublic ? profileData : null,
        badges,
        tags,
        privacy: isOwner ? privacy : null,
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/profile/my/data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get or create profile data
      let profileData = await storage.getUserProfileData(userId);
      
      // Get user badges
      const badges = await storage.getUserBadges(userId);
      
      // Get user tags
      const tags = await storage.getUserTags(userId);
      
      // Get privacy settings or create default
      let privacy = await storage.getUserPrivacySettings(userId);
      if (!privacy) {
        privacy = await storage.createOrUpdatePrivacySettings({
          userId,
          isProfilePublic: false,
          showBadges: false,
          showQuizResults: false,
          showTags: false,
          sharedDimensions: null,
          allowDiscovery: false,
        });
      }
      
      res.json({
        profileData,
        badges,
        tags,
        privacy,
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
      res.status(500).json({ error: "Failed to fetch profile data" });
    }
  });

  app.put("/api/profile/location", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate the request body
      const validationResult = locationDataSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid location data", 
          details: fromZodError(validationResult.error).toString()
        });
      }
      
      const updated = await storage.updateUser(userId, { locationData: validationResult.data as any });
      
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating location data:", error);
      res.status(500).json({ error: "Failed to update location data" });
    }
  });

  app.put("/api/profile/contact", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate the request body
      const validationResult = contactDataSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid contact data", 
          details: fromZodError(validationResult.error).toString()
        });
      }
      
      const updated = await storage.updateUser(userId, { contactData: validationResult.data as any });
      
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating contact data:", error);
      res.status(500).json({ error: "Failed to update contact data" });
    }
  });

  app.put("/api/profile/privacy", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const privacyUpdate = req.body;
      
      // Create or update privacy settings using the upsert method
      const updated = await storage.createOrUpdatePrivacySettings({
        userId,
        ...privacyUpdate,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ error: "Failed to update privacy settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
