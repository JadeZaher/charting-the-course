// Ecosystem cross-link admins (Lead Link / Rep Link). The server decides; this module only
// chooses which controls to show. See neos-operating-system ecosystem admin role matrix.

export type AdminDesignation = 'internal' | 'external';

export const ADMIN_DESIGNATIONS: readonly AdminDesignation[] = ['internal', 'external'];

export interface EcosystemAdminRow {
  id: string;
  display_name: string;
  designations: AdminDesignation[];
}

/** Who is looking at the roster. `memberId` is their row in this ecosystem, when they have one. */
export interface AdminActor {
  memberId: string | null;
  /** Member.role in this ecosystem. */
  role: string | null;
  active: boolean;
  isNodeAdmin: boolean;
  /** Designations this caller holds here. Empty when their row is unknown. */
  held: readonly AdminDesignation[];
}

export function designationLabel(designation: string): string {
  if (designation === 'internal') return 'Lead Link';
  if (designation === 'external') return 'Rep Link';
  return designation;
}

export function adminDesignationText(designations: readonly string[]): string {
  const labels = designations.map(designationLabel);
  return labels.length ? labels.join(', ') : 'No designation';
}

export function isAdminDesignation(value: unknown): value is AdminDesignation {
  return value === 'internal' || value === 'external';
}

/** Grant a link: an active owner, an active internal admin, or a node admin. */
export function canGrantLink(actor: AdminActor): boolean {
  if (actor.isNodeAdmin) return true;
  if (!actor.active) return false;
  return actor.role === 'owner' || actor.held.includes('internal');
}

/** Revoke or re-designate one person: that admin, or a node admin. Nobody else. */
export function canChangeLink(actor: AdminActor, adminMemberId: string): boolean {
  if (actor.isNodeAdmin) return true;
  if (!actor.active || !actor.memberId) return false;
  return actor.memberId === adminMemberId;
}

export function vacantDesignations(admins: readonly { designations: readonly string[] }[]): AdminDesignation[] {
  const held = new Set(admins.flatMap((admin) => admin.designations));
  return ADMIN_DESIGNATIONS.filter((designation) => !held.has(designation));
}

/** Any active member may claim a vacant seat, including both. */
export function canClaimSeat(actor: Pick<AdminActor, 'active'>, vacant: readonly AdminDesignation[]): boolean {
  return actor.active && vacant.length > 0;
}

/** Designations a re-designate action may leave this admin holding. The one they already solely hold is omitted. */
export function redesignateTargets(held: readonly string[]): AdminDesignation[] {
  return ADMIN_DESIGNATIONS.filter((designation) => held.length !== 1 || held[0] !== designation);
}

export function isSeatHeld(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ((error as { code?: unknown }).code === 'SEAT_HELD') return true;
  const status = (error as { status?: unknown }).status;
  const message = error instanceof Error ? error.message : '';
  return status === 403 && /already held/i.test(message);
}

export const SEAT_HELD_MESSAGE = 'That seat is already held.';

/**
 * Quiz creation. With no active admin, any active member may create one.
 * Once an admin is active, creation stays with the steward gate (a steward of the ecosystem, or a platform admin).
 */
export function canCreateQuiz(input: { hasActiveAdmin: boolean; isActiveMember: boolean; stewardGate: boolean }): boolean {
  if (input.stewardGate) return true;
  return !input.hasActiveAdmin && input.isActiveMember;
}

/** `owner === null` means no active admin. A missing field keeps the steward gate. */
export function ecosystemHasActiveAdmin(owner: unknown, ownerFieldPresent: boolean): boolean {
  if (!ownerFieldPresent) return true;
  return owner != null;
}
