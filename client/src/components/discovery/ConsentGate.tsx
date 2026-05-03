import type { ReactNode } from 'react';

interface Props {
  ethosId: string;
  children: ReactNode;
}

export function ConsentGate({ ethosId, children }: Props) {
  // TODO: Implement consent tracking via backend API when endpoint is available.
  // Previously used Supabase participant_contacts table for consent state.
  return <>{children}</>;
}
