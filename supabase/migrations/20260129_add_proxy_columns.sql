-- Add proxy feature columns to quizzes and quiz_results tables
-- These enable admin proxy quiz submission feature

-- Add hidden_from_user column to quizzes table
-- When true, the quiz is hidden from the user's dashboard (admin takes on their behalf)
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS hidden_from_user BOOLEAN NOT NULL DEFAULT false;

-- Add submitted_by column to quiz_results table
-- Records who actually submitted the quiz (null = user submitted for themselves)
ALTER TABLE quiz_results 
ADD COLUMN IF NOT EXISTS submitted_by VARCHAR REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for faster proxy submission lookups
CREATE INDEX IF NOT EXISTS idx_quiz_results_submitted_by ON quiz_results(submitted_by);

-- Add comment for documentation
COMMENT ON COLUMN quizzes.hidden_from_user IS 'If true, quiz is hidden from user dashboard (admin proxy feature)';
COMMENT ON COLUMN quiz_results.submitted_by IS 'User ID who submitted on behalf of another user (null = self-submitted)';
