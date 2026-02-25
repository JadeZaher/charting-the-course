import { Heart, Sparkles, Target, Briefcase, Brain, MapPin, TrendingUp, Users } from "lucide-react";

export const DIMENSION_CONFIGS: Record<string, { icon: any, title: string, variant: "default" | "cyan" | "emerald" | "amber" | "rose" }> = {
  personality: { icon: Heart, title: "Personality", variant: "rose" },
  strengths: { icon: Sparkles, title: "Primary Skills", variant: "emerald" },
  values: { icon: Target, title: "Core Values", variant: "cyan" },
  interests: { icon: Briefcase, title: "Work & Projects", variant: "amber" },
  growth: { icon: Brain, title: "Growth Focus", variant: "emerald" },
  general: { icon: Users, title: "Preferences", variant: "default" },
  land_criteria: { icon: MapPin, title: "Land Criteria", variant: "emerald" },
  project_resources: { icon: TrendingUp, title: "Project Resources", variant: "amber" },
};

export const getDimensionConfig = (dim: string) => {
  return DIMENSION_CONFIGS[dim] || {
    icon: Sparkles,
    title: dim.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    variant: "default"
  };
};
