// Prints a new random encryption key. Put it in .env as SSN_ENCRYPTION_KEY.
import crypto from 'node:crypto';

console.log(crypto.randomBytes(32).toString('hex'));
