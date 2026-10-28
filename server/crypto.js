// AES-256-GCM helpers. Used for SSNs and ID images before anything is written to disk.
import crypto from 'node:crypto';

export function loadKey() {
  const hex = (process.env.SSN_ENCRYPTION_KEY || '').trim();
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('SSN_ENCRYPTION_KEY must be 64 hex characters. Run "npm run keygen" and put the result in .env');
  }
  return Buffer.from(hex, 'hex');
}

// Returns iv (12 bytes) + auth tag (16 bytes) + ciphertext in one Buffer.
export function encrypt(key, plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

export function decrypt(key, blob) {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const body = blob.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}
