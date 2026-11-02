import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, fetchChallenge, fetchVerify, fetchLogout, loginWithPassword, registerAccount, resetDid, linkDid, getOAuthUrl, fetchOAuthProviders } from '@/lib/api-client';
import { generateKeyPair, signChallenge, saveKeyPair, loadKeyPair, clearKeyPair, publicKeyToDid } from '@/lib/did-auth';
import type { AuthMeResponse, MemberSummary, EcosystemSummary, OAuthProvider, PendingConsentGate } from '@/types/api';
import { resolveExternalUrl } from '@/lib/media';
import { apiErrorMessage } from '@/lib/api-error-message';

/** Result of a sign-in: whether a membership still waits on the agreement-consent gate. */
export interface SignInOutcome {
  consentRequired: boolean;
}

interface AuthContextType {
  /** The server's default row: the oldest active membership, else the oldest. */
  member: MemberSummary | null;
  user: AuthMeResponse['user'] | null;
  isNodeAdmin: boolean;
  /** Every membership, each with the caller's own `membership_status` and `role` there. */
  ecosystems: EcosystemSummary[];
  /** Memberships behind their ecosystem's agreement-consent gate (from /auth/me). */
  pendingConsents: PendingConsentGate[];
  /** Platform admin, set server-side (/auth/me `is_platform_admin`): the one source; never derived from a profile. */
  isPlatformAdmin: boolean;
  oauthProviders: OAuthProvider[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (displayName?: string) => Promise<SignInOutcome>;
  loginWithCredentials: (username: string, password: string) => Promise<SignInOutcome>;
  /** `ecosystemId` places the newcomer in the ecosystem their sign-up link names (lib/signup-ecosystem.ts). */
  register: (username: string, password: string, displayName?: string, ecosystemId?: string) => Promise<SignInOutcome>;
  loginWithOAuth: (provider: string) => Promise<void>;
  regenerateDid: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthMeResponse['user'] | null>(null);
  const [isNodeAdmin, setIsNodeAdmin] = useState(false);
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [ecosystems, setEcosystems] = useState<EcosystemSummary[]>([]);
  const [pendingConsents, setPendingConsents] = useState<PendingConsentGate[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check existing session on mount
  useEffect(() => {
    checkSession();
    loadOAuthProviders();
  }, []);

  function clearAuthCookies() {
    // Clear stale session cookies to prevent duplicates across domains
    document.cookie = 'neos_session=; Max-Age=0; path=/;';
    document.cookie = 'neos_selected_ecosystems=; Max-Age=0; path=/;';
  }

  /** Store one /auth/me answer. */
  function applySession(data: AuthMeResponse) {
    setUser(data.user ?? null);
    setIsNodeAdmin(data.is_node_admin === true);
    setMember(data.member);
    setEcosystems(data.ecosystems);
    setPendingConsents(data.pending_consents ?? []);
    setIsPlatformAdmin(data.is_platform_admin === true);
  }

  function clearSession() {
    setUser(null);
    setIsNodeAdmin(false);
    setMember(null);
    setEcosystems([]);
    setPendingConsents([]);
    setIsPlatformAdmin(false);
  }

  /** Load /auth/me; the outcome says whether the signed-in user still faces a consent gate. */
  async function checkSession(): Promise<SignInOutcome> {
    try {
      const data = await fetchMe();
      applySession(data);
      return { consentRequired: (data.pending_consents ?? []).length > 0 };
    } catch {
      // No valid session — clear any stale cookies
      clearAuthCookies();
      clearSession();
      return { consentRequired: false };
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOAuthProviders() {
    try {
      const data = await fetchOAuthProviders();
      setOauthProviders(data.providers);
    } catch {
      // OAuth not available — that's fine
    }
  }

  // Sign-in and sign-up leave the global isLoading alone, so Login stays mounted (client/src/AGENTS.md "Pass 03 fixes").
  const login = useCallback(async (displayName?: string) => {
    setError(null);

    try {
      // Load or generate keypair
      let keys = loadKeyPair();
      if (!keys) {
        const { publicKey, privateKey } = await generateKeyPair();
        saveKeyPair(publicKey, privateKey);
        keys = { publicKey, privateKey, did: publicKeyToDid(publicKey) };
      }

      // Request challenge
      const { challenge } = await fetchChallenge(keys.did);

      // Sign challenge
      const signature = await signChallenge(keys.privateKey, challenge);

      // Verify
      await fetchVerify({
        did: keys.did,
        challenge,
        signature,
        display_name: displayName,
      });

      // Non-fatal: write DID + public key to NEOS Den profiles table
      try {
        const publicKeyHex = Array.from(keys.publicKey)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/ctc/did/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ did: keys.did, public_key: publicKeyHex }),
        });
      } catch {
        // Non-fatal — DID write failure does not block login
      }

      // Session cookie is set by the response. Now fetch full member data.
      return await checkSession();
    } catch (err) {
      setError(apiErrorMessage(err));
      throw err;
    }
  }, []);

  const loginWithCredentials = useCallback(async (username: string, password: string) => {
    setError(null);

    try {
      await loginWithPassword(username, password);
      // Session cookie is set by the response. Now fetch full member data.
      return await checkSession();
    } catch (err) {
      clearAuthCookies();
      setError(apiErrorMessage(err));
      throw err;
    }
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string, ecosystemId?: string) => {
    setError(null);

    try {
      const registered = await registerAccount({ username, password, display_name: displayName, ecosystem_id: ecosystemId });
      const session = await checkSession();
      return { consentRequired: session.consentRequired || registered.status === 'consent_required' };
    } catch (err) {
      setError(apiErrorMessage(err));
      throw err;
    }
  }, []);

  const loginWithOAuth = useCallback(async (provider: string) => {
    setError(null);
    try {
      const { url } = await getOAuthUrl(provider, window.location.origin);
      const safeUrl = resolveExternalUrl(url);
      if (!safeUrl) throw new Error('OAuth provider returned an invalid URL');
      // Redirect to OAuth provider — callback will set cookie and redirect back
      window.location.assign(safeUrl);
    } catch (err) {
      setError(apiErrorMessage(err));
      throw err;
    }
  }, []);

  const regenerateDid = useCallback(async () => {
    setError(null);
    try {
      // Clear server-side DID
      await resetDid();
      // Clear local keypair
      clearKeyPair();

      // Generate new keypair
      const { publicKey, privateKey } = await generateKeyPair();
      saveKeyPair(publicKey, privateKey);
      const did = publicKeyToDid(publicKey);

      // Request challenge for the new DID
      const { challenge } = await fetchChallenge(did);
      const signature = await signChallenge(privateKey, challenge);

      // Link new DID to account
      await linkDid({ did, challenge, signature });

      // Refresh session data
      await checkSession();
    } catch (err) {
      setError(apiErrorMessage(err));
      throw err;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      applySession(await fetchMe());
    } catch {
      // Silent — session still valid, just couldn't refresh
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetchLogout();
    } catch {
      // Proceed with local cleanup even if server call fails
    }
    clearAuthCookies();
    clearSession();
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        member,
        user,
        isNodeAdmin,
        ecosystems,
        pendingConsents,
        isPlatformAdmin,
        oauthProviders,
        isAuthenticated: !!user?.id || !!member,
        isLoading,
        login,
        loginWithCredentials,
        register,
        loginWithOAuth,
        regenerateDid,
        logout,
        refreshSession,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
