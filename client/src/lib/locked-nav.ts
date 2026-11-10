// Pending members keep seeing nav items the consent gate would bounce.
// The item stays visible and says why it will not open. See client/src/AGENTS.md "Sign-up consent gate".
import { consentGateRedirect, type ConsentGateInput } from './consent-gate';

/** The accessible name and the tooltip. The item title is the first words, so the visible label stays in the name. */
export function lockedNavLabel(title: string): string {
  return `${title} opens once you finish joining. "What to do next" shows the steps that are left.`;
}

/**
 * True when a pending member (held at the consent gate) would be sent back to the gate from `path`.
 * Node administration stays open for a node admin, matching `consentGateRedirect`.
 */
export function isNavDestinationLocked(path: string, input: Pick<ConsentGateInput, 'isNodeAdmin'> & { held: boolean }): boolean {
  if (!input.held) return false;
  const redirect = consentGateRedirect({
    path,
    isAuthenticated: true,
    isNodeAdmin: input.isNodeAdmin,
    pendingConsents: [{ ecosystem_id: 'pending' }],
    memberships: [],
  });
  return redirect !== null;
}
