// Assistant drawer: tool chips and the confirmation step; see client/src/AGENTS.md "Assistant drawer".
import type { QueryKey } from '@tanstack/react-query';
import { resolveInternalPath } from './internal-path';
import { affects, keys, onboardingAffects } from './query-keys';

export type ToolStatus = 'running' | 'success' | 'error' | 'needs_confirmation';

/** The fields of a `tool_result` SSE event the drawer reads. */
export interface ToolResultEvent {
  name: string;
  label?: string;
  success?: boolean;
  error?: string | null;
  needs_confirmation?: string;
  data?: { link?: unknown } | null;
  artifact?: { route?: unknown } | null;
}

/** A tool call as the drawer shows it. */
export interface ToolChip {
  name: string;
  label?: string;
  status: ToolStatus;
  error?: string;
  confirmation?: string;
}

/** Plain words for each chip status (never the tool's code name). */
export const TOOL_STATUS_TEXT: Record<ToolStatus, string> = {
  running: 'working',
  success: 'done',
  error: "didn't go through",
  needs_confirmation: 'waiting for your OK',
};

/** What the member sends from the confirmation card. */
export const CONFIRM_REPLY = 'Yes, go ahead.';
export const DECLINE_REPLY = "No, don't do it.";

/** A finished call's status: an irreversible act waiting for the member is neither done nor failed. */
export function toolStatusFromResult(event: ToolResultEvent): ToolStatus {
  if (event.needs_confirmation) return 'needs_confirmation';
  return event.success ? 'success' : 'error';
}

/** The chips after a `tool_result`: the oldest running call of that tool takes the outcome. */
export function applyToolResult(chips: readonly ToolChip[], event: ToolResultEvent): ToolChip[] {
  const index = chips.findIndex((chip) => chip.name === event.name && chip.status === 'running');
  if (index === -1) return [...chips];
  const status = toolStatusFromResult(event);
  const updated = [...chips];
  updated[index] = {
    ...chips[index],
    label: event.label ?? chips[index].label,
    status,
    ...(status === 'error' && event.error ? { error: event.error } : {}),
    ...(status === 'needs_confirmation' ? { confirmation: event.needs_confirmation } : {}),
  };
  return updated;
}

/**
 * The question waiting for the member, if the latest reply asked one: the assistant's last message,
 * finished streaming, with a call that is waiting for the member's OK and nothing said since.
 */
export function pendingConfirmation(
  messages: readonly { role: 'user' | 'assistant'; isStreaming?: boolean; tools?: readonly ToolChip[] }[],
): string | null {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'assistant' || last.isStreaming) return null;
  const waiting = [...(last.tools ?? [])].reverse().find((chip) => chip.status === 'needs_confirmation' && chip.confirmation);
  return waiting?.confirmation ?? null;
}

/** Tools that only read: they cannot change what is waiting or a record's status. Unknown tools count as writes. */
const READ_ONLY_TOOL = /^(get|list|search|check)_/;
const READ_ONLY_TOOLS = new Set(['explain_status', 'what_needs_me', 'find_shares_needs']);

export function isReadOnlyTool(name: string): boolean {
  return READ_ONLY_TOOL.test(name) || READ_ONLY_TOOLS.has(name);
}

/** App route prefix -> query-key collection (client/src/lib/query-keys.ts). */
const ROUTE_COLLECTIONS = {
  proposals: 'proposals', agreements: 'agreements', domains: 'domains', conflicts: 'conflicts',
  exit: 'exits', emergency: 'emergency', decisions: 'decisions', 'safeguards/audits': 'audits',
  collaborations: 'collaborations', ecosystems: 'ecosystems', members: 'members',
  'discover/collaborations': 'collaborations',
} as const;

export type RecordCollection = (typeof ROUTE_COLLECTIONS)[keyof typeof ROUTE_COLLECTIONS] | 'sharesNeeds' | 'conversations';

/** The record a result points at, from its link (`/proposals/<id>`) or artifact route; null when it names none. */
export function touchedRecord(event: ToolResultEvent): { collection: RecordCollection; id: string } | null {
  for (const candidate of [event.data?.link, event.artifact?.route]) {
    if (typeof candidate !== 'string') continue;
    const path = resolveInternalPath(candidate);
    if (!path) continue;
    const url = new URL(path, 'https://neos.local');
    const match = /^\/(proposals|agreements|domains|conflicts|exit|emergency|decisions|safeguards\/audits|discover\/collaborations|collaborations|ecosystems|members)\/([\w-]+)(?:\/|$)/.exec(url.pathname);
    if (match) return { collection: ROUTE_COLLECTIONS[match[1] as keyof typeof ROUTE_COLLECTIONS], id: match[2] };
    const collection = url.pathname === '/discover' && url.searchParams.get('tab') === 'shares-needs' ? 'sharesNeeds'
      : url.pathname === '/messaging' ? 'conversations' : null;
    const id = collection && url.searchParams.get(collection === 'sharesNeeds' ? 'post' : 'conversation');
    if (collection && id && /^[\w-]+$/.test(id)) return { collection, id };
  }
  return null;
}

const RECORD_AFFECTS: Record<RecordCollection, readonly QueryKey[]> = {
  proposals: affects.proposals, agreements: affects.agreements, domains: affects.domains,
  conflicts: affects.conflicts, exits: affects.exits, emergency: affects.emergency,
  decisions: [keys.decisions.all, keys.myDecisions.all], audits: affects.audits,
  collaborations: affects.exchangeCollaborations, ecosystems: affects.ecosystems, members: onboardingAffects.memberMove,
  sharesNeeds: affects.exchangePosts, conversations: affects.conversations,
};

const TOOL_AFFECTS: Readonly<Record<string, readonly QueryKey[]>> = {
  create_proposal: affects.proposals, record_advice: affects.proposals, record_consent_position: affects.proposals,
  withdraw_consent_position: affects.proposals, update_proposal_status: affects.proposals, submit_test_report: affects.proposals,
  create_agreement_draft: affects.agreements, update_agreement_status: affects.agreements,
  record_agreement_evidence: affects.agreements,
  attest_agreement_consent: [...affects.agreements, ...onboardingAffects.joinEcosystem],
  create_decision_record: RECORD_AFFECTS.decisions, create_domain_draft: affects.domains, join_domain: affects.domains,
  create_conflict_case: affects.conflicts, triage_conflict: affects.conflicts, create_repair_agreement: affects.conflicts,
  declare_emergency: affects.emergency, cosign_emergency: affects.emergency,
  end_emergency_authority: affects.emergency, record_emergency_review: affects.emergency, create_exit_record: affects.exits,
  create_ecosystem: affects.ecosystems, join_ecosystem: onboardingAffects.joinEcosystem,
  move_member: onboardingAffects.memberMove, create_safeguard_audit: affects.audits, respond_to_health_audit: affects.audits,
  publish_share_need: affects.exchangePosts, respond_to_share_need: affects.exchangePosts, update_share_need_status: affects.exchangePosts,
  approve_collaboration: affects.exchangeCollaborations, end_collaboration: affects.exchangeCollaborations,
  review_collaboration: affects.exchangeCollaborations,
};

/** Data and membership refreshed after a completed assistant write; see the directory's "Assistant drawer" contract. */
export function refreshAfterTool(event: ToolResultEvent): { queryKeys: readonly QueryKey[]; refreshSession: boolean } {
  if (!event.success || event.needs_confirmation || isReadOnlyTool(event.name)) return { queryKeys: [], refreshSession: false };
  const record = touchedRecord(event);
  const toolPrefixes = Object.hasOwn(TOOL_AFFECTS, event.name) ? TOOL_AFFECTS[event.name] : [];
  const prefixes = [keys.nextSteps.all, keys.dashboard.all, keys.safeguards.all,
    ...toolPrefixes, ...(record ? RECORD_AFFECTS[record.collection] : [])];
  return {
    queryKeys: Array.from(new Map(prefixes.map((key) => [JSON.stringify(key), key] as const)).values()),
    refreshSession: event.name === 'join_ecosystem' || event.name === 'attest_agreement_consent',
  };
}
