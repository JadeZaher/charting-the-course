import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Circle } from "lucide-react";

interface ListTileProps {
  data: {
    title: string;
    content: {
      items?: Array<{ label: string; value?: string; icon?: string }>;
    };
  };
}

export function ListTile({ data }: ListTileProps) {
  const { title, content } = data;
  const items = content.items || [];

  return (
    <Card className="h-full">
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base" data-testid="text-list-title">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "pt-0" : "p-4"}>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm" data-testid={`list-item-${index}`}>
              <Circle className="w-2 h-2 mt-1.5 fill-primary text-primary flex-shrink-0" />
              <span>
                <span className="font-medium">{item.label}</span>
                {item.value && <span className="text-muted-foreground"> - {item.value}</span>}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
