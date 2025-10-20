import { Badge } from "@/components/ui/badge";
import { Shield, Users, Edit, Eye } from "lucide-react";

type Role = "Admin" | "Facilitator" | "Contributor" | "Viewer";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleConfig = {
  Admin: {
    variant: "default" as const,
    icon: Shield,
  },
  Facilitator: {
    variant: "secondary" as const,
    icon: Users,
  },
  Contributor: {
    variant: "outline" as const,
    icon: Edit,
  },
  Viewer: {
    variant: "outline" as const,
    icon: Eye,
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={className}
      data-testid={`badge-role-${role.toLowerCase()}`}
    >
      <Icon className="h-3 w-3 mr-1" />
      {role}
    </Badge>
  );
}
