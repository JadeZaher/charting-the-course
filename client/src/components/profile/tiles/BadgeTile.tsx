import { Card, CardContent } from "@/components/ui/card";
import { 
  Award, Star, Trophy, Medal, Heart, Zap, Target, Users, Lightbulb, Compass,
  Home, Sprout, Building, MapPin, Mountain, TreePine, PiggyBank, Landmark, 
  TrendingUp, Hammer, Armchair, Handshake, Quote, Globe, Clock, Map, 
  MessageCircle, Languages, Globe2, Plane, Navigation, Briefcase, Palmtree, 
  Laptop, Eye, Shield, UtensilsCrossed, BookOpen, Palette
} from "lucide-react";

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
  home: Home,
  sprout: Sprout,
  building: Building,
  mappin: MapPin,
  mountain: Mountain,
  trees: TreePine,
  treepine: TreePine,
  piggybank: PiggyBank,
  landmark: Landmark,
  trendingup: TrendingUp,
  hammer: Hammer,
  armchair: Armchair,
  handshake: Handshake,
  quote: Quote,
  globe: Globe,
  clock: Clock,
  map: Map,
  messagecircle: MessageCircle,
  languages: Languages,
  globe2: Globe2,
  plane: Plane,
  navigation: Navigation,
  briefcase: Briefcase,
  palmtree: Palmtree,
  laptop: Laptop,
  eye: Eye,
  shield: Shield,
  utensilscrossed: UtensilsCrossed,
  bookopen: BookOpen,
  palette: Palette
};

export function BadgeTile({ data }: BadgeTileProps) {
  const { title, content } = data;
  const iconKey = (content.badge_icon || 'award').toLowerCase();
  const IconComponent = iconMap[iconKey] || Award;
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
