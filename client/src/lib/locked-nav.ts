// Pending members keep seeing nav items the consent gate would bounce.
// The item stays visible and says why it will not open. Activating it points at
// the join path and does not open the route. See client/src/AGENTS.md "Sign-up consent gate".
import { consentGateRedirect, type ConsentGateInput } from './consent-gate';
import { CONSENT_GATE_PATH } from './member-status';
import { spaceHomeCopy } from './space-home-copy';

/** The accessible name and the tooltip. The item title is the first words, so the visible label stays in the name. */
export function lockedNavLabel(title: string): string {
  return `${title} opens once you finish joining. "What to do next" shows the steps that are left.`;
}

/** What a locked item shows when a pending member activates it. The sentence is `lockedNavLabel`. */
export interface LockedNavNote {
  sentence: string;
  /** `spaceHomeCopy.header.finishJoining`, the space-home header control. */
  linkLabel: string;
  href: string;
}

/** A nav control: an ordinary link, or a visible, focusable, aria-disabled locked item. */
export type NavItemControl =
  | { locked: false; href: string }
  | { locked: true; label: string; ariaDisabled: true; focusable: true };

export function navItemForMember(
  item: { title: string; url: string },
  access: { held: boolean; isNodeAdmin?: boolean },
): NavItemControl {
  if (!isNavDestinationLocked(item.url, access)) return { locked: false, href: item.url };
  return { locked: true, label: lockedNavLabel(item.title), ariaDisabled: true, focusable: true };
}

/**
 * Ecosystem of the membership the member still has to finish, when one was sent.
 * Pending consent gates come first; otherwise the non-active member row.
 */
export function pendingMembershipEcosystemId(input: {
  pendingConsents?: readonly { ecosystem_id?: string | null }[] | null;
  member?: { ecosystem_id?: string | null; current_status?: string | null } | null;
}): string | null {
  for (const gate of input.pendingConsents ?? []) {
    const id = gate.ecosystem_id?.trim();
    if (id) return id;
  }
  if (input.member && input.member.current_status !== 'active') {
    const id = input.member.ecosystem_id?.trim();
    if (id) return id;
  }
  return null;
}

/** Where "Finish joining" goes. No ecosystem id stays on the consent gate instead of guessing a space. */
export function lockedJoinHref(ecosystemId: string | null | undefined): string {
  const id = ecosystemId?.trim();
  if (!id) return CONSENT_GATE_PATH;
  return `/ethos/${encodeURIComponent(id)}#what-to-do-next`;
}

/**
 * Activating a nav item. A locked item explains how to finish joining and leaves the
 * current route closed: it does not open `url` and it does not redirect by itself.
 */
export function activateLockedNav(input: {
  title: string;
  url: string;
  held: boolean;
  isNodeAdmin?: boolean;
  ecosystemId?: string | null;
}): { routeStaysClosed: boolean; note: LockedNavNote | null } {
  if (!isNavDestinationLocked(input.url, { held: input.held, isNodeAdmin: input.isNodeAdmin })) {
    return { routeStaysClosed: false, note: null };
  }
  return {
    routeStaysClosed: true,
    note: {
      sentence: lockedNavLabel(input.title),
      linkLabel: spaceHomeCopy.header.finishJoining,
      href: lockedJoinHref(input.ecosystemId),
    },
  };
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
