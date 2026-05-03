import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasSavedIdentity, generateKeyPair, saveKeyPair } from '../lib/did-auth';

export function useDIDInit() {
  const { member } = useAuth();

  useEffect(() => {
    if (!member) return;
    initDID();
  }, [member?.id]);

  async function initDID() {
    try {
      if (hasSavedIdentity()) return;
      const keyPair = await generateKeyPair();
      saveKeyPair(keyPair.publicKey, keyPair.privateKey);
      // DID is registered with the backend during the auth verify flow
    } catch (err) {
      console.error('[DID] Init failed:', err);
    }
  }
}
