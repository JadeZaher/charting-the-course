import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasExistingDID, generateAndStoreDID } from '../lib/did';

export function useDIDInit() {
  const { member } = useAuth();

  useEffect(() => {
    if (!member) return;
    initDID();
  }, [member?.id]);

  async function initDID() {
    try {
      if (await hasExistingDID()) return;
      await generateAndStoreDID();
      // DID is registered with the backend during the auth verify flow
    } catch (err) {
      console.error('[DID] Init failed:', err);
    }
  }
}
