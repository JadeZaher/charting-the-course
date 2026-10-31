// Member status wording and the agreement-consent gate route (see client/src/AGENTS.md "Sign-up consent gate").

/** Client route listing the agreements a pending member must consent to; the API's OAuth callback redirects here. */
export const CONSENT_GATE_PATH = '/welcome/consent';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active member',
  pending_consent: 'Awaiting agreement consent',
  prospective: 'Prospective member',
  exited: 'Former member',
};

/** Human label for a Member.current_status value; unknown values read as words, never snake_case. */
export function memberStatusLabel(status: string | null | undefined): string {
  if (!status) return '';
  const known = STATUS_LABELS[status];
  if (known) return known;
  const words = status.replace(/[_-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
