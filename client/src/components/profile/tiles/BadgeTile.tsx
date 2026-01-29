import { Card, CardContent } from "@/components/ui/card";
import { Award, Star, Trophy, Medal, Heart, Zap, Target, Users, Lightbulb, Compass } from "lucide-react";

interface BadgeTileProps {
  data: {
    title: string;
    content: {
      badge_key?: string;
      badge_icon?: string;
      badge_color?: string;
      badge_description?: string;
    };
  };
}

const iconMap: Record<string, typeof Award> = {
  award: Award,
  star: Star,
  trophy: Trophy,
  medal: Medal,
  heart: Heart,
  zap: Zap,
  target: Target,
  users: Users,
  lightbulb: Lightbulb,
  compass: Compass,
};

export function BadgeTile({ data }: BadgeTileProps) {
  const { title, content } = data;
  const IconComponent = iconMap[content.badge_icon || 'award'] || Award;
  const badgeColor = content.badge_color || 'primary';

  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center bg-primary/10"
          data-testid={`badge-icon-${content.badge_key}`}
        >
          <IconComponent className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-semibold text-sm" data-testid="text-badge-title">{title}</h3>
        {content.badge_description && (
          <p className="text-xs text-muted-foreground">{content.badge_description}</p>
        )}
      </CardContent>
    </Card>
  );
}
