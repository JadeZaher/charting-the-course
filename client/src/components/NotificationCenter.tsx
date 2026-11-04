import { useState } from "react";
import { ClipboardList as Bell } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { QueryState } from "@/components/QueryState";
import { useMyNextSteps } from "@/hooks/use-next-steps";
import { bellBadge, bellLabel, dueStatus, formatDue, nextStepKindLabel } from "@/lib/next-steps";

/** The header bell: what is waiting for the member (GET /me/next-steps, the same list as the dashboard queue). */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const query = useMyNextSteps({ poll: true });
  const count = query.data?.count;
  const badge = bellBadge(count);
  const now = new Date();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={bellLabel(count)}>
          <Bell className="h-4 w-4" aria-hidden="true" />
          {badge && (
            <Badge
              variant="destructive"
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center border border-background px-1 text-[10px]"
            >
              {badge}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-w-[calc(100vw-1rem)] p-0" align="end">
        <div className="p-4 pb-3">
          <h3 className="text-sm font-semibold">Waiting for you</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">In every ecosystem you are active in. Items leave once they are done.</p>
        </div>
        <Separator />
        <div className="max-h-96 overflow-y-auto">
          <QueryState
            query={query}
            errorTitle="We couldn't load what is waiting for you"
            isEmpty={(data) => data.items.length === 0}
            empty={
              <div className="p-8 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">Nothing is waiting for you</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Advice to give, positions to record, emergencies to co-sign and steward steps show up here when they are yours.
                </p>
              </div>
            }
          >
            {(data) => (
              <ul className="divide-y divide-border">
                {data.items.map((item) => {
                  const due = dueStatus(item.due, item.overdue, now, formatDue);
                  return (
                    <li key={item.uid}>
                      <Link
                        href={item.link}
                        onClick={() => setOpen(false)}
                        className="block min-h-11 p-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      >
                        <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-muted-foreground">
                          {nextStepKindLabel(item.kind)}{item.ecosystem ? ` · ${item.ecosystem}` : ""}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold leading-snug">{item.what}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.title}</p>
                        {due && (
                          <p className={`mt-1 text-xs ${due.overdue ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                            {due.text}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </QueryState>
        </div>
        <Separator />
        <div className="p-2">
          <Button asChild variant="ghost" size="sm" className="w-full text-xs">
            <Link href="/dashboard" onClick={() => setOpen(false)}>Open your decision queue</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
