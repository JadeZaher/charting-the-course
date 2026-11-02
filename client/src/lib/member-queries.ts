export function memberQueriesEnabled(member: { id?: unknown } | null | undefined): boolean {
  return typeof member?.id === 'string' && member.id.length > 0;
}
