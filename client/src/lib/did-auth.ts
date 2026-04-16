// DID Auth Utilities — Ed25519 keypair management using Web Crypto API
// Keys stored in localStorage as hex strings

const PRIVATE_KEY_STORAGE = 'neos_did_private_key';
const PUBLIC_KEY_STORAGE = 'neos_did_public_key';
const DID_STORAGE = 'neos_did';

// Ed25519 multicodec prefix (0xed01)
const ED25519_MULTICODEC = new Uint8Array([0xed, 0x01]);

// Base58btc alphabet (Bitcoin alphabet)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  // Convert bytes to BigInt
  let num = BigInt(0);
  for (const b of bytes) {
    num = num * BigInt(256) + BigInt(b);
  }
  // Encode to base58
  let encoded = '';
  while (num > BigInt(0)) {
    const remainder = Number(num % BigInt(58));
    num = num / BigInt(58);
    encoded = BASE58_ALPHABET[remainder] + encoded;
  }
  // Handle leading zeros
  for (const b of bytes) {
    if (b === 0) encoded = '1' + encoded;
    else break;
  }
  return encoded;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export async function generateKeyPair(): Promise<{ publicKey: Uint8Array; privateKey: Uint8Array }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true,
    ['sign', 'verify']
  );

  const privateRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const publicRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);

  // PKCS8 for Ed25519 has a 16-byte prefix, raw key is last 32 bytes
  const privateBytes = new Uint8Array(privateRaw);
  const publicBytes = new Uint8Array(publicRaw);

  return { publicKey: publicBytes, privateKey: privateBytes };
}

export function publicKeyToDid(publicKey: Uint8Array): string {
  const multicodec = new Uint8Array(ED25519_MULTICODEC.length + publicKey.length);
  multicodec.set(ED25519_MULTICODEC);
  multicodec.set(publicKey, ED25519_MULTICODEC.length);
  return 'did:key:z' + base58Encode(multicodec);
}

export async function signChallenge(privateKeyBytes: Uint8Array, challenge: string): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(challenge);
  const signature = await crypto.subtle.sign('Ed25519', privateKey, data);

  return bytesToHex(new Uint8Array(signature));
}

export function saveKeyPair(publicKey: Uint8Array, privateKey: Uint8Array): void {
  localStorage.setItem(PUBLIC_KEY_STORAGE, bytesToHex(publicKey));
  localStorage.setItem(PRIVATE_KEY_STORAGE, bytesToHex(privateKey));
  localStorage.setItem(DID_STORAGE, publicKeyToDid(publicKey));
}

export function loadKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array; did: string } | null {
  const pubHex = localStorage.getItem(PUBLIC_KEY_STORAGE);
  const privHex = localStorage.getItem(PRIVATE_KEY_STORAGE);
  const did = localStorage.getItem(DID_STORAGE);

  if (!pubHex || !privHex || !did) return null;

  return {
    publicKey: hexToBytes(pubHex),
    privateKey: hexToBytes(privHex),
    did,
  };
}

export function clearKeyPair(): void {
  localStorage.removeItem(PUBLIC_KEY_STORAGE);
  localStorage.removeItem(PRIVATE_KEY_STORAGE);
  localStorage.removeItem(DID_STORAGE);
}

export function hasSavedIdentity(): boolean {
  return !!localStorage.getItem(DID_STORAGE);
}

export function getSavedDid(): string | null {
  return localStorage.getItem(DID_STORAGE);
}
