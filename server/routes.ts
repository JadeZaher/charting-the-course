import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertQuizSchema, 
  insertQuizResultSchema, 
  insertQuizProgressSchema,
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
    return {
      ...quiz,
      questions: quiz.questions.map(q => ({
        ...q,
        correctAnswer: undefined,
      })),
    };
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
      const bodySchema = insertQuizResultSchema.pick({ answers: true, timeSpent: true });
      const validation = bodySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid submission data",
          errors: fromZodError(validation.error).toString()
        });
      }

      const { answers, timeSpent } = validation.data;

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

      // Calculate score
      const { score, isPassed, gradedAnswers } = calculateScore(quiz, answers);

      // Save result
      const result = await storage.createQuizResult({
        quizId,
        userId,
        answers: gradedAnswers,
        score,
        isPassed,
        timeSpent,
        isImported: false,
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
