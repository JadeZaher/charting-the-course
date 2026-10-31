// Domain naming on the client. The server's display_name is authoritative
// (name -> purpose "Name — " prefix -> generated code); see pages/governance/AGENTS.md.

type DomainNaming = { domain_id: string; display_name?: string | null };

/** Primary human label for a domain; falls back to its generated code. */
export function domainLabel(domain: DomainNaming): string {
  return domain.display_name?.trim() || domain.domain_id;
}

/** The generated code as secondary text, or null when the label already is the code. */
export function domainCode(domain: DomainNaming): string | null {
  return domainLabel(domain) === domain.domain_id ? null : domain.domain_id;
}

/** One-line label for select options: "Name (DOM-XXXX)". */
export function domainOptionLabel(domain: DomainNaming): string {
  const code = domainCode(domain);
  return code ? `${domainLabel(domain)} (${code})` : domainLabel(domain);
}
