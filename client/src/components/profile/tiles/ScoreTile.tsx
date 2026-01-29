import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ScoreTileProps {
  data: {
    title: string;
    content: {
      score_value?: number;
      score_max?: number;
      score_label?: string;
    };
  };
}

export function ScoreTile({ data }: ScoreTileProps) {
  const { title, content } = data;
  const value = content.score_value ?? 0;
  const max = content.score_max ?? 100;
  const percentage = Math.round((value / max) * 100);

  return (
    <Card className="h-full">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base" data-testid="text-score-title">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : "p-4"}>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-3xl font-bold" data-testid="text-score-value">{value}</span>
            <span className="text-sm text-muted-foreground">/ {max}</span>
          </div>
          <Progress value={percentage} className="h-2" />
          {content.score_label && (
            <p className="text-xs text-muted-foreground text-center mt-2">{content.score_label}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
