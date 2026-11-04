import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Compass, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
  isPlatformTourEligible, PLATFORM_TOUR_STEPS, readPlatformTourProgress,
  savePlatformTourProgress, shouldOfferPlatformTour, type PlatformTourProgress,
} from '@/lib/platform-tour';

const browserStorage = () => window.localStorage;

export function PlatformTour() {
  const { user, isAuthenticated, ecosystems, pendingConsents, member } = useAuth();
  if (!isPlatformTourEligible({ userId: user?.id, isAuthenticated, memberships: ecosystems, pendingConsents, member })) return null;
  return <MemberPlatformTour key={user!.id} ownerId={user!.id} />;
}

function MemberPlatformTour({ ownerId }: { ownerId: string }) {
  const [location, navigate] = useLocation();
  const [progress, setProgress] = useState(() => readPlatformTourProgress(ownerId, browserStorage));
  const [open, setOpen] = useState(false);
  const [savedLocally, setSavedLocally] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const openedRoute = useRef(location);
  const leavingRoute = useRef(false);
  const stepIndex = progress?.step ?? 0;
  const step = PLATFORM_TOUR_STEPS[stepIndex];

  function save(status: PlatformTourProgress['status'], index = stepIndex) {
    const next: PlatformTourProgress = { version: 1, status, step: index };
    setSavedLocally(savePlatformTourProgress(ownerId, next, browserStorage));
    setProgress(next);
  }

  function launch() {
    leavingRoute.current = false;
    openedRoute.current = location;
    save('in_progress', progress?.status === 'completed' ? 0 : stepIndex);
    setOpen(true);
  }

  function pause() {
    save('paused');
    setOpen(false);
  }

  useEffect(() => {
    if (!shouldOfferPlatformTour(location, progress)) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'hidden' || document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      window.clearInterval(timer);
      launch();
    }, 500);
    return () => window.clearInterval(timer);
  }, [location, progress]);

  useEffect(() => {
    if (open && location !== openedRoute.current) {
      leavingRoute.current = true;
      pause();
    }
  }, [location, open]);

  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus();
  }, [stepIndex, open]);

  function visit(href: string) {
    leavingRoute.current = new URL(href, window.location.origin).pathname !== location;
    pause();
    navigate(href);
  }

  return (
    <>
      <Button ref={triggerRef} variant="ghost" size="icon" className="w-auto shrink-0 px-3" onClick={launch}
        aria-label="Platform tour" title="Platform tour" data-testid="button-platform-tour">
        <Compass aria-hidden="true" />
        <span>Platform tour</span>
      </Button>
      <Dialog open={open} onOpenChange={(next) => { if (!next) pause(); }}>
        <DialogContent
          data-testid="platform-tour"
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto motion-reduce:animate-none [&>button:last-child]:right-1 [&>button:last-child]:top-1 [&>button:last-child]:flex [&>button:last-child]:h-11 [&>button:last-child]:w-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center"
          onOpenAutoFocus={(event) => { event.preventDefault(); titleRef.current?.focus(); }}
          onCloseAutoFocus={(event) => { event.preventDefault(); if (!leavingRoute.current) triggerRef.current?.focus(); }}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="space-y-3 pr-7">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Platform tour · Step {stepIndex + 1} of {PLATFORM_TOUR_STEPS.length}</p>
            <DialogTitle ref={titleRef} tabIndex={-1} className="text-2xl leading-tight">{step.title}</DialogTitle>
            <DialogDescription className="leading-6">{step.description}</DialogDescription>
          </div>
          <div className="space-y-3 border-y border-border py-4">
            <p className="text-sm font-bold">{step.location}</p>
            <p className="text-sm leading-6 text-muted-foreground">{step.detail}</p>
            <div className="flex flex-wrap gap-2">
              {step.links.map((link) => (
                <Button key={link.href} variant="outline" size="sm" className="max-w-full whitespace-normal text-left" onClick={() => visit(link.href)}>
                  {link.label}<ArrowRight aria-hidden="true" />
                </Button>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Opening a page pauses the tour. Use Platform tour in the top bar to resume.</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" onClick={pause}>Skip for now</Button>
            <div className="flex gap-2">
              <Button variant="outline" disabled={stepIndex === 0} onClick={() => save('in_progress', stepIndex - 1)}>Back</Button>
              {stepIndex === PLATFORM_TOUR_STEPS.length - 1
                ? <Button onClick={() => { save('completed'); setOpen(false); }}>Finish tour</Button>
                : <Button onClick={() => save('in_progress', stepIndex + 1)}>Next</Button>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>{savedLocally ? 'Progress is saved in this browser.' : 'Browser storage is unavailable. Progress is kept for this session.'}</p>
            {stepIndex > 0 && <Button variant="ghost" size="sm" onClick={() => save('in_progress', 0)}>Restart tour</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
