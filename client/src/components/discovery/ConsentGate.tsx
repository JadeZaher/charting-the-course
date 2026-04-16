import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ConsentText {
  heading: string;
  body: string;
  accept_label: string;
  decline_label: string;
}

const DEFAULT_CONSENT: ConsentText = {
  heading: 'Before you enter',
  body: 'By entering this area, you will be visible to other matched participants.',
  accept_label: 'I understand, continue',
  decline_label: 'Not now',
};

interface Props {
  ethosId: string;
  children: React.ReactNode;
}

export function ConsentGate({ ethosId, children }: Props) {
  const { member } = useAuth();
  const [, navigate] = useLocation();

  // Consent persisted in localStorage per user per ethos
  // TODO: Replace with GET/POST /api/v1/consent when NEOS Den endpoint exists
  const consentKey = `consent:${ethosId}:${member?.id ?? 'anon'}`;
  const [hasConsented, setHasConsented] = useState(
    () => !!member?.id && localStorage.getItem(consentKey) === 'true'
  );
  const [isPending, setIsPending] = useState(false);

  // TODO: Load consent text from /api/v1/settings/consent-text when endpoint exists
  const consentText: ConsentText = DEFAULT_CONSENT;

  const handleAccept = () => {
    if (!member?.id) return;
    setIsPending(true);
    localStorage.setItem(consentKey, 'true');
    setHasConsented(true);
    setIsPending(false);
  };

  const handleDecline = () => {
    navigate('/discover');
  };

  // Already consented — render children directly
  if (hasConsented) {
    return <>{children}</>;
  }

  // Not consented — render children behind blocking modal
  return (
    <>
      {children}
      <Dialog
        open={!hasConsented}
        onOpenChange={() => {
          // Locked — user must accept or decline
        }}
      >
        <DialogContent
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {/* Suppress the default DialogContent close button */}
          <style>{`
            [data-radix-dialog-content] button[data-radix-dialog-close] {
              display: none !important;
            }
          `}</style>
          <DialogHeader>
            <DialogTitle>{consentText.heading}</DialogTitle>
            <DialogDescription>{consentText.body}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2 justify-end">
            <Button
              variant="outline"
              onClick={handleDecline}
              disabled={isPending}
            >
              {consentText.decline_label}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {consentText.accept_label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
