-- Add result_metadata column to quiz_results for flexible quiz result data
-- This stores question counts, completion rates, and other extensible metadata

ALTER TABLE quiz_results 
ADD COLUMN IF NOT EXISTS result_metadata jsonb;

-- Add comment describing the column
COMMENT ON COLUMN quiz_results.result_metadata IS 'Flexible metadata: totalQuestions, answeredQuestions, skippedQuestions, correctCount, incorrectCount, gradableQuestions, completionPercentage, correctnessPercentage, isAssessment';
