/** What /auth/me means after a sign-in attempt. A failed read is not a session. */
export interface CheckedSession {
  signedIn: boolean;
  consentRequired: boolean;
}

export function checkedSession(
  result: { ok: true; pendingConsents?: readonly unknown[] | null } | { ok: false },
): CheckedSession {
  if (!result.ok) return { signedIn: false, consentRequired: false };
  return { signedIn: true, consentRequired: (result.pendingConsents ?? []).length > 0 };
}

export interface SignInSuccessNotice {
  title: 'Login Successful';
  description: 'Welcome to NEOS!';
  consentRequired: boolean;
}

/** The existing success toast. Nothing, when /me did not establish a session. */
export function signInSuccessNotice(session: CheckedSession): SignInSuccessNotice | null {
  if (!session.signedIn) return null;
  return { title: 'Login Successful', description: 'Welcome to NEOS!', consentRequired: session.consentRequired };
}
