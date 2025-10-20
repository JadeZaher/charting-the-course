import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Download, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// TODO: remove mock functionality
const mockResults = {
  quizId: "quiz-1",
  title: "Foundations of Cooperation",
  score: 88,
  totalQuestions: 10,
  correctAnswers: 9,
  completedAt: "2024-01-15T14:30:00Z",
  timeSpent: "12 minutes",
  questions: [
    {
      id: "q1",
      question: "What is the primary benefit of team collaboration?",
      userAnswer: "Shared knowledge and diverse perspectives",
      correctAnswer: "Shared knowledge and diverse perspectives",
      isCorrect: true,
    },
    {
      id: "q2",
      question: "Which communication style is most effective in teams?",
      userAnswer: "Passive",
      correctAnswer: "Assertive",
      isCorrect: false,
    },
    {
      id: "q3",
      question: "What role does trust play in team dynamics?",
      userAnswer: "Foundation for effective collaboration",
      correctAnswer: "Foundation for effective collaboration",
      isCorrect: true,
    },
  ],
};

export default function QuizResults() {
  const scorePercentage = mockResults.score;
  const isPassing = scorePercentage >= 70;

  const handleExport = () => {
    const data = JSON.stringify(mockResults, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-results-${mockResults.quizId}.json`;
    a.click();
    console.log("Results exported");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold" data-testid="text-results-title">
            Quiz Results
          </h1>
          <p className="text-muted-foreground mt-1">{mockResults.title}</p>
        </div>
        <Button variant="outline" onClick={handleExport} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>

      {/* Score Overview */}
      <Card>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="relative inline-flex">
                <div className="h-32 w-32 rounded-full border-8 border-muted flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold" data-testid="text-score">
                      {scorePercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Badge
                  variant={isPassing ? "default" : "destructive"}
                  className="text-base px-4 py-1"
                  data-testid="badge-pass-fail"
                >
                  {isPassing ? "Passed" : "Failed"}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Correct Answers</span>
                <span className="font-semibold" data-testid="text-correct-answers">
                  {mockResults.correctAnswers} / {mockResults.totalQuestions}
                </span>
              </div>
              <Progress
                value={(mockResults.correctAnswers / mockResults.totalQuestions) * 100}
              />
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-muted-foreground">Time Spent</span>
                <span className="font-semibold">{mockResults.timeSpent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-semibold">
                  {new Date(mockResults.completedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {mockResults.questions.map((q, index) => (
            <div
              key={q.id}
              className="p-4 rounded-lg border space-y-3"
              data-testid={`question-result-${index}`}
            >
              <div className="flex items-start gap-3">
                {q.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-chart-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <p className="font-medium">
                    Question {index + 1}: {q.question}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Your answer:</span>
                      <span
                        className={q.isCorrect ? "text-chart-3" : "text-destructive"}
                      >
                        {q.userAnswer}
                      </span>
                    </div>
                    {!q.isCorrect && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Correct answer:</span>
                        <span className="text-chart-3">{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <Button variant="outline" data-testid="button-retake">
          Retake Quiz
        </Button>
        <Button data-testid="button-next-quiz">
          Next Quiz
        </Button>
      </div>
    </div>
  );
}
