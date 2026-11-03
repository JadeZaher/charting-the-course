// Which memberships count as active, and the route guard for members with none (see client/src/AGENTS.md "Sign-up consent gate", "Onboarding (G-Onboard)").
import { CONSENT_GATE_PATH } from './member-status';

/** What AuthContext knows about the signed-in user's memberships. */
export interface MembershipsInput {
  /** Memberships behind their ecosystem's consent gate (AuthContext.pendingConsents). */
  pendingConsents: readonly { ecosystem_id: string }[];
  /** Every ecosystem the member belongs to, gated or not (AuthContext.ecosystems); `membership_status` is the caller's row status there. */
  memberships: readonly { id: string; membership_status?: string }[];
  /** The /auth/me member row (the server's default): used only when the API sends no per-ecosystem status. */
  member?: { ecosystem_id: string; current_status: string } | null;
}

export interface ConsentGateInput extends MembershipsInput {
  isAuthenticated: boolean;
  isNodeAdmin?: boolean;
  /** Current pathname, without the query string. */
  path: string;
}

/** What a gated member may still open: the gate, the agreements it asks them to read, the ethos, orientation, and public pages. */
const READABLE_WHILE_GATED: readonly RegExp[] = [
  new RegExp(`^${CONSENT_GATE_PATH}$`),
  /^\/agreements\/(?!new$)[^/]+(?:\/history)?$/,
  /^\/ethos(?:\/.*)?$/,
  // G-Onboard: the framework's order is walkthrough first, then consent.
  /^\/orientation\/[^/]+(?:\/journey|\/complete)?$/,
  /^\/quiz\/(?:take|results)\/[^/]+$/,
  /^\/(?:about|governance-model)$/,
  /^\/users\/[^/]+$/,
  /^\/node\/audit(?:\/[^/]+)?$/,
  /^\/communities(?:\/[^/]+)?$/,
  /^\/updates$/,
  /^\/settings\/notifications$/,
];

/** Ecosystems the user takes part in: the server's per-ecosystem status when sent, else not gated and not a non-active default row. */
export function activeEcosystemIds({ pendingConsents, memberships, member }: MembershipsInput): string[] {
  const gated = new Set(pendingConsents.map((gate) => gate.ecosystem_id));
  if (member && member.current_status !== 'active') gated.add(member.ecosystem_id);
  return memberships
    .filter((ecosystem) => (ecosystem.membership_status === undefined ? !gated.has(ecosystem.id) : ecosystem.membership_status === 'active'))
    .map((ecosystem) => ecosystem.id);
}

/** The ecosystem to select when the cookie names none: the server's default (oldest active) when known, else the first active. */
export function defaultEcosystemId(input: MembershipsInput): string | null {
  const active = activeEcosystemIds(input);
  const oldest = input.member?.ecosystem_id;
  return oldest && active.includes(oldest) ? oldest : active[0] ?? null;
}

/** True when a signed-in user waits on consent and is active nowhere: the gate holds them. */
export function isHeldAtConsentGate({ isAuthenticated, ...memberships }: Omit<ConsentGateInput, 'path'>): boolean {
  return isAuthenticated && memberships.pendingConsents.length > 0 && activeEcosystemIds(memberships).length === 0;
}

/** Where to send the member instead of `path`, or null to render it. */
export function consentGateRedirect({ path, isNodeAdmin, ...input }: ConsentGateInput): string | null {
  if (isNodeAdmin === true && /^\/admin(?:\/.*)?$/.test(path)) return null;
  // An active membership elsewhere keeps the app usable; the sidebar links to the pending gate.
  if (!isHeldAtConsentGate(input)) return null;
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return READABLE_WHILE_GATED.some((pattern) => pattern.test(normalized)) ? null : CONSENT_GATE_PATH;
}

/** Confirm copy before withdrawing consent to a membership agreement (owner default: withdrawal returns the member to pending). */
export function membershipWithdrawalWarning(ecosystemName: string): string {
  return `You will stop taking part in ${ecosystemName} until you consent again; any steward role you hold there pauses.`;
}
