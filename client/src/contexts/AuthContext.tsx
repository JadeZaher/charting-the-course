import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, fetchChallenge, fetchVerify, fetchLogout } from '@/lib/api-client';
import { generateKeyPair, signChallenge, saveKeyPair, loadKeyPair, publicKeyToDid } from '@/lib/did-auth';
import type { MemberSummary, EcosystemSummary } from '@/types/api';

interface AuthContextType {
  member: MemberSummary | null;
  ecosystems: EcosystemSummary[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [ecosystems, setEcosystems] = useState<EcosystemSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check existing session on mount
  useEffect(() => {
    checkSession();
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

      // Session cookie is set by the response. Now fetch full member data.
      await checkSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
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
        isAuthenticated: !!member,
        isLoading,
        login,
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
