// Assistant drawer: tool chips and the confirmation step; see client/src/AGENTS.md "Assistant drawer".

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
const READ_ONLY_TOOLS = new Set(['explain_status', 'what_needs_me']);

export function isReadOnlyTool(name: string): boolean {
  return READ_ONLY_TOOL.test(name) || READ_ONLY_TOOLS.has(name);
}

/** App route prefix -> query-key collection (client/src/lib/query-keys.ts). */
const ROUTE_COLLECTIONS = {
  proposals: 'proposals', agreements: 'agreements', domains: 'domains', conflicts: 'conflicts',
  exit: 'exits', emergency: 'emergency', decisions: 'decisions', 'safeguards/audits': 'audits',
} as const;

export type RecordCollection = (typeof ROUTE_COLLECTIONS)[keyof typeof ROUTE_COLLECTIONS];

/** The record a result points at, from its link (`/proposals/<id>`) or artifact route; null when it names none. */
export function touchedRecord(event: ToolResultEvent): { collection: RecordCollection; id: string } | null {
  for (const candidate of [event.data?.link, event.artifact?.route]) {
    if (typeof candidate !== 'string') continue;
    const match = /^\/(proposals|agreements|domains|conflicts|exit|emergency|decisions|safeguards\/audits)\/([^/?#]+)/.exec(candidate);
    if (match) return { collection: ROUTE_COLLECTIONS[match[1] as keyof typeof ROUTE_COLLECTIONS], id: match[2] };
  }
  return null;
}

/** What a finished tool call makes stale: nothing for a failed or read-only call; else the queue and the touched record. */
export function refreshAfterTool(event: ToolResultEvent): { nextSteps: boolean; record: ReturnType<typeof touchedRecord> } {
  if (!event.success || event.needs_confirmation || isReadOnlyTool(event.name)) return { nextSteps: false, record: null };
  return { nextSteps: true, record: touchedRecord(event) };
}
