import * as ed from '@noble/ed25519';
import bs58 from 'bs58';

const DB_NAME = 'omnione-did';
const STORE_NAME = 'keys';
const KEY_NAME = 'ed25519-private';

async function openDB(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE_NAME);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function storePrivateKey(k: Uint8Array): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(k, KEY_NAME);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function getPrivateKey(): Promise<Uint8Array | null> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const r = tx.objectStore(STORE_NAME).get(KEY_NAME);
    r.onsuccess = () => res(r.result ?? null);
    r.onerror = () => rej(r.error);
  });
}

export function publicKeyToDID(pubKey: Uint8Array): string {
  const mc = new Uint8Array(2 + pubKey.length);
  mc[0] = 0xed;
  mc[1] = 0x01;
  mc.set(pubKey, 2);
  return 'did:key:z' + bs58.encode(mc);
}

export async function generateAndStoreDID(): Promise<{ did: string; publicKey: string }> {
  const priv = ed.utils.randomPrivateKey();
  const pub = await ed.getPublicKeyAsync(priv);
  await storePrivateKey(priv);
  return {
    did: publicKeyToDID(pub),
    publicKey: Buffer.from(pub).toString('hex')
  };
}

export async function hasExistingDID(): Promise<boolean> {
  return (await getPrivateKey()) !== null;
}
