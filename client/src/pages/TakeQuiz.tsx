import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

// TODO: remove mock functionality
const mockQuiz = {
  id: "quiz-1",
  title: "Foundations of Cooperation",
  questions: [
    {
      id: "q1",
      text: "What is the primary benefit of team collaboration?",
      options: [
        "Individual recognition",
        "Shared knowledge and diverse perspectives",
        "Faster completion times",
        "Reduced workload",
      ],
    },
    {
      id: "q2",
      text: "Which communication style is most effective in teams?",
      options: [
        "Passive",
        "Aggressive",
        "Assertive",
        "Passive-aggressive",
      ],
    },
    {
      id: "q3",
      text: "What role does trust play in team dynamics?",
      options: [
        "It's optional",
        "Foundation for effective collaboration",
        "Only matters in leadership",
        "Slows down decision-making",
      ],
    },
    {
      id: "q4",
      text: "How should conflicts be addressed in a team?",
      options: [
        "Avoid them entirely",
        "Address them promptly and constructively",
        "Let them resolve naturally",
        "Escalate to management immediately",
      ],
    },
  ],
};

export default function TakeQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);

  const progress = ((currentQuestion + 1) / mockQuiz.questions.length) * 100;
  const question = mockQuiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === mockQuiz.questions.length - 1;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value,
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsComplete(true);
      console.log("Quiz completed with answers:", answers);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentQuestion((prev) => Math.max(0, prev - 1));
  };

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-chart-3/20 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-chart-3" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
              <p className="text-muted-foreground">
                Your answers have been submitted successfully.
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" data-testid="button-back-to-quizzes">
                Back to Quizzes
              </Button>
              <Button data-testid="button-view-results">
                View Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-quiz-title">
          {mockQuiz.title}
        </h1>
        <div className="flex items-center gap-4 mt-4">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {mockQuiz.questions.length}
          </span>
          <Progress value={progress} className="flex-1" />
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl" data-testid="text-question">
            {question.text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[question.id]}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 rounded-lg border hover-elevate cursor-pointer"
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  data-testid={`radio-option-${index}`}
                />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          data-testid="button-previous"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!answers[question.id]}
          data-testid="button-next"
        >
          {isLastQuestion ? "Submit" : "Next"}
          {!isLastQuestion && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
