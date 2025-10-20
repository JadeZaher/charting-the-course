import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  imageSrc?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  imageSrc,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" data-testid="empty-state">
      {imageSrc ? (
        <img src={imageSrc} alt={title} className="w-48 h-48 mb-6 object-contain opacity-80" />
      ) : (
        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} data-testid="button-empty-state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
