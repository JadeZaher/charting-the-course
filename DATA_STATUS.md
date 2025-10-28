# Quiz Platform - Data Status Report

## How Quiz Results Are Saved

When a user completes a quiz:

1. **Backend Processing:**
   - Extracts all questions from `quiz.surveyJson.pages[].elements[]`
   - For each question with a `correctAnswer` field:
     - Compares user's answer with the correct answer (case-insensitive string comparison)
     - Counts correct answers
   - Calculates score as percentage: `(correctAnswers / totalQuestions) × 100`
   
2. **Database Storage** (`quiz_results` table):
   - `surveyResults`: Complete JSON object with all user answers
   - `score`: Calculated percentage (0-100)
   - `isPassed`: Boolean based on `quiz.passingScore` threshold
   - `timeSpent`: Seconds spent on quiz
   - `userId` and `quizId`: Links result to user and quiz
   - `completedAt`: Timestamp of submission

## Pages Using Real Data ✅

### QuizList
- **Data Source:** `/api/quizzes`
- **What it shows:** All published quizzes from database
- **Features:** Search, visibility badges, time limits

### QuizManagement
- **Data Source:** `/api/quizzes` (with upload to same endpoint)
- **What it shows:** Quiz upload interface for admins/facilitators
- **Features:** JSON upload, visibility controls, passing score settings

### TakeQuiz
- **Data Source:** `/api/quizzes/:id` and `/api/quiz-progress/:id`
- **What it shows:** SurveyJS-rendered quiz with real questions
- **Features:** Auto-save progress, submission with scoring

### Profile (Updated)
- **Data Source:** `/api/quiz-results/user`
- **What it shows:** User's completed quiz results with scores
- **Features:** 
  - Real statistics: completed quiz count, average score
  - List of all completed quizzes with scores and dates
  - Click-through links to view detailed results
  - JSON export of profile data

### QuizResults (Updated)
- **Data Source:** `/api/quiz-results/:quizId` and `/api/quizzes/:id`
- **What it shows:** Detailed quiz submission with answer review
- **Features:**
  - Score breakdown and pass/fail status
  - Question-by-question review
  - User answers vs. correct answers comparison
  - Time spent and completion date
  - Retake quiz button

## Pages Still Using Mock Data ⚠️

### AdminPanel
**Mock Data:**
- `mockUsers`: Array of fake user data
- `mockCourses`: Array of fake course/quiz data

**Real API Available:**
- `/api/users` - Fetch all users (admin only)
- `/api/quizzes` - Fetch all quizzes (admin only)

**Why Still Mocked:** Not prioritized for MVP

### Dashboard
**Mock Data:**
- Video placeholder (no real video source configured)

**What's Missing:** 
- No video content uploaded or URL configured
- Webinar video embed URL not provided

**Note:** This is intentional - requires external content that doesn't exist yet

## Pages With No Mock Data (User Input Required)

### MapView
**Not Mocked** - Users enter their own Miro board URLs
- Default Miro board URL is pre-configured
- Supports image uploads as alternative
- No database-backed map data (by design)

## Features Not Yet Implemented

### Missing from Current Platform:
1. **Quiz Titles in Profile List** - Profile shows "Quiz Result" instead of quiz title (minor UX issue)
2. **In-Progress Quiz Tracking** - No UI to resume incomplete quizzes
3. **Team/Group Management** - Assignment features exist in backend but no UI
4. **Quiz Analytics Dashboard** - No aggregate statistics or leaderboards

### Why Quiz Assignments Aren't Visible:
- Backend supports `assignedToUserId` and `assignedToTeamId`
- No UI to create assignments or view assigned quizzes
- API endpoints exist: 
  - `POST /api/assignments/:quizId/assign`
  - `GET /api/assignments/quiz/:quizId`

## Summary

### ✅ Working End-to-End:
1. Admin/facilitator uploads quiz JSON (from SurveyJS online demo)
2. Quiz appears in QuizList for all users
3. Users take quiz with SurveyJS renderer
4. Results are scored and saved to database
5. Users can view completed quizzes in Profile
6. Users can review their answers in QuizResults page

### ⚠️ Still Needs Real Data:
- AdminPanel user/quiz management
- Dashboard statistics (could pull from quiz results API)

### 🔮 Future Features (Backend Ready, No UI):
- Quiz assignments to specific users/teams
- In-progress quiz resume functionality
- Analytics and leaderboards
