import crypto from 'node:crypto';

const PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64, PARAMS);
  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}

// Always does the same amount of work, even for an unknown user, so response time reveals nothing.
export function checkPassword(pw, saltHex, hashHex) {
  const salt = Buffer.from(saltHex || '00'.repeat(16), 'hex');
  const want = Buffer.from(hashHex || '00'.repeat(64), 'hex');
  const got = crypto.scryptSync(String(pw), salt, 64, PARAMS);
  return want.length === got.length && crypto.timingSafeEqual(want, got) && !!hashHex;
}
