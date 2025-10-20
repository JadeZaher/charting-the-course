import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type QuizStatus = "not_started" | "in_progress" | "completed";

interface QuizCardProps {
  id: string;
  title: string;
  description?: string;
  status: QuizStatus;
  score?: number;
  estimatedTime?: number;
  progress?: number;
  onStart?: () => void;
  onUpload?: () => void;
  onViewResults?: () => void;
}

const statusConfig = {
  not_started: { label: "Not Started", variant: "outline" as const },
  in_progress: { label: "In Progress", variant: "secondary" as const },
  completed: { label: "Completed", variant: "default" as const },
};

export function QuizCard({
  id,
  title,
  description,
  status,
  score,
  estimatedTime,
  progress,
  onStart,
  onUpload,
  onViewResults,
}: QuizCardProps) {
  const config = statusConfig[status];

  return (
    <Card className="hover-elevate" data-testid={`card-quiz-${id}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <h3 className="font-semibold text-lg" data-testid="text-quiz-title">{title}</h3>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
              )}
            </div>
            <Badge variant={config.variant} data-testid="badge-quiz-status">
              {config.label}
            </Badge>
          </div>

          {status === "completed" && score !== undefined && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-chart-3" />
              <span className="text-sm font-medium">Score: {score}%</span>
            </div>
          )}

          {status === "in_progress" && progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            {estimatedTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{estimatedTime} min</span>
              </div>
            )}
            
            <div className="flex gap-2 ml-auto">
              {status === "completed" ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onViewResults}
                  data-testid="button-view-results"
                >
                  View Results
                </Button>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    onClick={onStart}
                    data-testid="button-start-quiz"
                  >
                    {status === "in_progress" ? "Continue" : "Start Quiz"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onUpload}
                    data-testid="button-upload-quiz"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
