import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
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
  const { user } = useSupabaseAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Check if user has already consented for this ethos
  const { data: consentRow, isLoading: consentLoading } = useQuery({
    queryKey: ['consent-check', user?.id, ethosId],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('participant_contacts')
        .select('consented_at')
        .eq('user_id', user.id)
        .eq('ethos_id', ethosId)
        .not('consented_at', 'is', null)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!ethosId,
  });

  // Fetch consent text from app_settings
  const { data: settingData, isLoading: settingLoading } = useQuery({
    queryKey: ['app-settings-consent-text'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'ethos_consent_text')
        .single();
      return data?.value as ConsentText | null;
    },
  });

  const consentText: ConsentText = settingData ?? DEFAULT_CONSENT;
  const hasConsented = !!consentRow;
  const isLoading = consentLoading || settingLoading;

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      await supabase
        .from('participant_contacts')
        .upsert(
          {
            user_id: user.id,
            ethos_id: ethosId,
            consented_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,ethos_id' }
        );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consent-check', user?.id, ethosId] });
    },
  });

  const handleDecline = () => {
    navigate('/discover');
  };

  // Show loading until both queries resolve
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              disabled={acceptMutation.isPending}
            >
              {consentText.decline_label}
            </Button>
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {consentText.accept_label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
