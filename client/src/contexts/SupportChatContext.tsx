import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { readSupportChatScope, type SupportChatScope } from '@/lib/support-chat';

interface SupportChatState {
  context: SupportChatScope | null;
  launchVersion: number;
  launch: (scope: SupportChatScope) => void;
  leave: () => void;
  restore: (scope: unknown) => void;
}
const Context = createContext<SupportChatState | null>(null);
export function SupportChatProvider({ children }: { children: ReactNode }) {
  const { user, isNodeAdmin } = useAuth();
  const owner = user?.id ?? '';
  const [saved, setSaved] = useState<{ owner: string; scope: SupportChatScope | null; version: number }>({ owner: '', scope: null, version: 0 });
  useEffect(() => {
    setSaved(current => current.owner !== owner || !isNodeAdmin ? { owner, scope: null, version: current.version } : current);
  }, [owner, isNodeAdmin]);
  const context = isNodeAdmin && saved.owner === owner ? saved.scope : null;
  function launch(scope: SupportChatScope) {
    const valid = readSupportChatScope(scope);
    if (!owner || !isNodeAdmin || !valid) return;
    setSaved(current => ({ owner, scope: valid, version: current.version + 1 }));
  }
  function leave() { setSaved(current => ({ owner, scope: null, version: current.version + 1 })); }
  function restore(scope: unknown) { setSaved(current => ({ owner, scope: isNodeAdmin ? readSupportChatScope(scope) : null, version: current.version })); }
  return <Context.Provider value={{ context, launchVersion: saved.version, launch, leave, restore }}>{children}</Context.Provider>;
}
export function useSupportChat() {
  const context = useContext(Context);
  if (!context) throw new Error('useSupportChat must be used within SupportChatProvider');
  return context;
}
