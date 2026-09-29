const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

let cachedKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  
  const keyBase64 = process.env.TOKEN_ENCRYPTION_KEY!;
  const keyBuffer = Buffer.from(keyBase64, 'base64');
  cachedKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
  return cachedKey;
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return Buffer.from(combined).toString('base64');
}

export async function decryptToken(ciphertextB64: string): Promise<string> {
  const key = await getKey();
  const combined = Buffer.from(ciphertextB64, 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

import * as bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}