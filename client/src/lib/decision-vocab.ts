// Decision record wording; see pages/governance/AGENTS.md (decision list).

/** What was decided, in words: the title the ACT engine puts before " — " in the holding, else its opening, else the record id. */
export function decisionHeadline(holding: string | null | undefined, recordId: string): string {
  const lead = (holding ?? '').split(' — ')[0].trim();
  if (!lead) return recordId;
  return lead.length > 100 ? `${lead.slice(0, 99).trimEnd()}…` : lead;
}
