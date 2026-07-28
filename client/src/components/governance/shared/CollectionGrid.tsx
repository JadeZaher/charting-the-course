import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface CollectionGridProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
}

interface CollectionCardProps extends ComponentPropsWithoutRef<'article'> {
  asChild?: boolean;
}

/** Responsive ruled-card layout for governance collections. */
export function CollectionGrid({ children, className, ...props }: CollectionGridProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-3', className)} {...props}>
      {children}
    </div>
  );
}

/** Focusable card shell; use `asChild` with a link for navigable records. */
export function CollectionCard({ asChild = false, className, ...props }: CollectionCardProps) {
  const Component = asChild ? Slot : 'article';

  return (
    <Component
      className={cn(
        'block border-2 border-strong-border bg-card p-5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  );
}
