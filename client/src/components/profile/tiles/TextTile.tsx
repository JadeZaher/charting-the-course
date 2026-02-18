import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TextTileProps {
  data: {
    title: string;
    content: {
      text?: string;
      subtitle?: string;
    };
  };
}

export function TextTile({ data }: TextTileProps) {
  const { title, content } = data;

  return (
    <Card className="h-full">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base" data-testid="text-tile-title">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : "p-4"}>
        {content.subtitle && (
          <p className="text-sm text-muted-foreground mb-1">{content.subtitle}</p>
        )}
        <p className="text-sm" data-testid="text-tile-content">{content.text}</p>
      </CardContent>
    </Card>
  );
}
