import { apiFetch } from './api-client';

const OWNER_KEY = 'neos:push-owner';
const WORKER = '/sw.js';
function owner(): string | null { try { return localStorage.getItem(OWNER_KEY); } catch { return null; } }
function rememberOwner(id: string | null) { try { if (id) localStorage.setItem(OWNER_KEY, id); else localStorage.removeItem(OWNER_KEY); } catch { /* Storage may be unavailable. */ } }
export function supportsWebPush() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && window.isSecureContext;
}
export function decodePushKey(key: string): Uint8Array {
  const padded = key.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - key.length % 4) % 4);
  const bytes = Uint8Array.from(atob(padded), char => char.charCodeAt(0));
  if (bytes.length !== 65 || bytes[0] !== 4) throw new Error('The browser push key is invalid. Contact node support.');
  return bytes;
}
async function existingRegistration() {
  if (!supportsWebPush()) return undefined;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const script = registration?.active?.scriptURL || registration?.waiting?.scriptURL || registration?.installing?.scriptURL;
  return script === new URL(WORKER, window.location.origin).href ? registration : undefined;
}
export async function currentPushSubscription(userId: string): Promise<PushSubscription | null> {
  if (owner() !== userId) return null;
  return (await existingRegistration())?.pushManager.getSubscription() ?? null;
}
export async function clearBrowserPush(authenticatedCleanup = false): Promise<void> {
  const subscription = await (await existingRegistration())?.pushManager.getSubscription();
  let cleanupError: unknown;
  if (subscription) {
    if (authenticatedCleanup) {
      try { await apiFetch('/api/v1/engagement/push', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }), signal: AbortSignal.timeout(5000) }); }
      catch (error) { cleanupError = error; }
    }
    await subscription.unsubscribe();
  }
  rememberOwner(null);
  if (cleanupError) throw cleanupError;
}
export async function reconcilePushOwner(userId: string | null) {
  const prior = owner();
  if (prior && prior !== userId) await clearBrowserPush(false);
}
function waitForActive(registration: ServiceWorkerRegistration): Promise<void> {
  if (registration.active) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const worker = registration.installing || registration.waiting;
    if (!worker) { reject(new Error('Browser push could not start. Please try again.')); return; }
    const timer = window.setTimeout(() => { worker.removeEventListener('statechange', changed); reject(new Error('Browser push setup timed out. Please try again.')); }, 10000);
    const changed = () => {
      if (worker.state === 'activated') { window.clearTimeout(timer); worker.removeEventListener('statechange', changed); resolve(); }
      if (worker.state === 'redundant') { window.clearTimeout(timer); worker.removeEventListener('statechange', changed); reject(new Error('Browser push could not start. Please try again.')); }
    };
    worker.addEventListener('statechange', changed);
    changed();
  });
}
export async function enrollBrowserPush(userId: string, publicKey: string): Promise<void> {
  if (!supportsWebPush()) throw new Error('Browser push needs a supported browser and a secure connection.');
  const key = decodePushKey(publicKey);
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Browser permission was not granted. You can change this in your browser settings.');
  await reconcilePushOwner(userId);
  const registration = await navigator.serviceWorker.register(WORKER, { scope: '/' });
  await waitForActive(registration);
  let subscription = await registration.pushManager.getSubscription();
  if (subscription && owner() !== userId) { await subscription.unsubscribe(); subscription = null; }
  subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  try {
    await apiFetch('/api/v1/engagement/push', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription.toJSON()) });
    rememberOwner(userId);
  } catch (error) {
    await subscription.unsubscribe();
    rememberOwner(null);
    throw error;
  }
}
