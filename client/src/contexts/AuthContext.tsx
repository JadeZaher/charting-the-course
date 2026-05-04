import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, fetchChallenge, fetchVerify, fetchLogout, loginWithPassword, registerWithPassword, resetDid, linkDid, getOAuthUrl, fetchOAuthProviders } from '@/lib/api-client';
import { generateKeyPair, signChallenge, saveKeyPair, loadKeyPair, clearKeyPair, publicKeyToDid } from '@/lib/did-auth';
import type { MemberSummary, EcosystemSummary, OAuthProvider } from '@/types/api';

interface AuthContextType {
  member: MemberSummary | null;
  ecosystems: EcosystemSummary[];
  oauthProviders: OAuthProvider[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (displayName?: string) => Promise<void>;
  loginWithCredentials: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  loginWithOAuth: (provider: string) => Promise<void>;
  regenerateDid: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [ecosystems, setEcosystems] = useState<EcosystemSummary[]>([]);
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check existing session on mount
  useEffect(() => {
    checkSession();
    loadOAuthProviders();
  }, []);

  async function checkSession() {
    try {
      const data = await fetchMe();
      setMember(data.member);
      setEcosystems(data.ecosystems);
    } catch {
      // No valid session — that's fine
      setMember(null);
      setEcosystems([]);
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

  const login = useCallback(async (displayName?: string) => {
    setError(null);
    setIsLoading(true);

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
      await checkSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const loginWithCredentials = useCallback(async (username: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      await loginWithPassword(username, password);
      // Session cookie is set by the response. Now fetch full member data.
      await checkSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      await registerWithPassword(username, password, displayName);
      await checkSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      setIsLoading(false);
      throw err;
    }
  }, []);

  const loginWithOAuth = useCallback(async (provider: string) => {
    setError(null);
    try {
      const { url } = await getOAuthUrl(provider);
      // Redirect to OAuth provider — callback will set cookie and redirect back
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth failed');
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
      setError(err instanceof Error ? err.message : 'DID regeneration failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetchLogout();
    } catch {
      // Proceed with local cleanup even if server call fails
    }
    setMember(null);
    setEcosystems([]);
    queryClient.clear();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        member,
        ecosystems,
        oauthProviders,
        isAuthenticated: !!member,
        isLoading,
        login,
        loginWithCredentials,
        register,
        loginWithOAuth,
        regenerateDid,
        logout,
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
