// The ecosystem a sign-up link names, so register places the newcomer there (see client/src/AGENTS.md "Onboarding (G-Onboard)").

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** In-app paths that name an ecosystem by id: its ethos page and its orientation. */
const ECOSYSTEM_PATH = /^\/(?:ethos|orientation)\/([^/?#]+)(?:[/?#].*)?$/;

/** The ecosystem id from `?ecosystem=<uuid>`, else from `?redirect=/ethos/<uuid>` or `/orientation/<uuid>…`; anything else is null. */
export function signupEcosystemId(search: string): string | null {
  const params = new URLSearchParams(search);
  const explicit = params.get('ecosystem')?.trim() ?? '';
  if (UUID.test(explicit)) return explicit.toLowerCase();
  const redirect = params.get('redirect') ?? '';
  const named = ECOSYSTEM_PATH.exec(redirect)?.[1] ?? '';
  return UUID.test(named) ? named.toLowerCase() : null;
}
