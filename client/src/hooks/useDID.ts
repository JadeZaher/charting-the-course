import { useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '../lib/supabase';
import { generateAndStoreDID, hasExistingDID } from '../lib/did';

export function useDIDInit() {
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) return;
    initDID();
  }, [user?.id]);

  async function initDID() {
    try {
      if (await hasExistingDID()) return;
      const { did, publicKey } = await generateAndStoreDID();
      const { error } = await supabase.functions.invoke('did-generate', {
        body: { did, public_key: publicKey }
      });
      if (error) console.error('[DID] Server write failed:', error);
    } catch (err) {
      console.error('[DID] Init failed:', err);
    }
  }
}
