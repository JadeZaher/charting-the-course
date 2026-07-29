import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { getRouteGuide } from "@/lib/route-guides";
import { cn } from "@/lib/utils";
import { BookOpenText, PanelRightClose, ArrowRight } from "lucide-react";

const STORAGE_KEY = "neos:route-guide-open";

/**
 * Route-aware governance guide. Collapses to a vertical handle on the right
 * edge; expands into a panel of accordioned, per-page steps. Renders nothing
 * on routes without guide content. Open state persists across sessions.
 */
export function RouteGuidePanel() {
  const [location] = useLocation();
  const guide = getRouteGuide(location);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, [open]);

  // Escape closes the panel; focus stays where it was.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!guide) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-controls="route-guide-panel"
          aria-label={`Open the ${guide.title} guide`}
          data-testid="button-open-route-guide"
          className="fixed right-0 top-1/2 z-40 flex min-h-[96px] min-w-[44px] -translate-y-1/2 items-center justify-center gap-2 border-2 border-r-0 border-strong-border bg-background px-2.5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
          style={{ writingMode: "vertical-rl" }}
        >
          <BookOpenText className="h-4 w-4 rotate-90" aria-hidden="true" />
          Guide
        </button>
      )}

      {open && (
        <aside
          id="route-guide-panel"
          role="complementary"
          aria-label={`${guide.title} guide`}
          data-testid="route-guide-panel"
          className={cn(
            "fixed z-40 flex flex-col border-2 border-strong-border bg-background",
            isMobile
              ? "inset-x-2 bottom-20 top-16"
              : "bottom-24 right-0 top-16 w-[380px] border-r-0"
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-2 border-b-2 border-strong-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                What to do here
              </p>
              <h2 className="text-base font-bold leading-tight">{guide.title}</h2>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">{guide.intro}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-expanded={true}
              aria-controls="route-guide-panel"
              aria-label="Close guide"
              data-testid="button-close-route-guide"
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
            >
              <PanelRightClose className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {/* key resets accordion state when the route changes */}
            <Accordion
              key={guide.prefix}
              type="single"
              collapsible
              defaultValue="section-0"
              className="px-4"
            >
              {guide.sections.map((section, index) => (
                <AccordionItem
                  key={section.title}
                  value={`section-${index}`}
                  className="border-strong-border"
                >
                  <AccordionTrigger className="min-h-11 py-3 text-left text-sm font-bold">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal space-y-2 pl-5 text-sm leading-snug marker:text-muted-foreground">
                      {section.steps.map((step, stepIndex) => (
                        <li key={stepIndex}>{step}</li>
                      ))}
                    </ol>
                    {section.link && (
                      <Link
                        href={section.link.to}
                        className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-primary underline underline-offset-4"
                      >
                        {section.link.label}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>

          <div className="shrink-0 border-t-2 border-strong-border px-4 py-2 text-[11px] leading-snug text-muted-foreground">
            Steps follow the ecosystem governance model.{" "}
            <Link href="/governance-model" className="underline underline-offset-2">
              Read the model
            </Link>
          </div>
        </aside>
      )}
    </>
  );
}
