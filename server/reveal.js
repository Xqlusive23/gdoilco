// Owner tool. Decrypts one application's SSN or ID file on the machine that holds the key.
//   node server/reveal.js GD-261004-AB12CD            show the application with the SSN decrypted
//   node server/reveal.js GD-261004-AB12CD front      write the decrypted front ID to ./reveal-out/
//   node server/reveal.js GD-261004-AB12CD back       write the decrypted back ID to ./reveal-out/
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decrypt, loadKey } from './crypto.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(here, '..', process.env.DATA_DIR || './server/data');
const [ref, which] = process.argv.slice(2);
if (!ref || !/^GD-[\dA-Z-]+$/.test(ref)) { console.error('Usage: node server/reveal.js <reference> [front|back]'); process.exit(1); }

const key = loadKey();
const file = path.join(DATA_DIR, 'applications', ref + '.json');
if (!fs.existsSync(file)) { console.error('No application with that reference.'); process.exit(1); }
const rec = JSON.parse(fs.readFileSync(file, 'utf8'));

if (which === 'front' || which === 'back') {
  const name = rec.idFiles?.[which];
  if (!name) { console.error('That side was not uploaded.'); process.exit(1); }
  const plain = decrypt(key, fs.readFileSync(path.join(DATA_DIR, 'ids', name)));
  const out = path.resolve('reveal-out');
  fs.mkdirSync(out, { recursive: true, mode: 0o700 });
  const target = path.join(out, name.replace(/\.enc$/, ''));
  fs.writeFileSync(target, plain, { mode: 0o600 });
  console.log('Wrote', target, '(delete it when you are done)');
} else {
  const ssn = decrypt(key, Buffer.from(rec.ssn.enc, 'base64')).toString('utf8');
  const { enc, ...ssnRest } = rec.ssn;
  console.log(JSON.stringify({ ...rec, ssn: ssn.replace(/^(\d{3})(\d{2})(\d{4})$/, '$1-$2-$3'), ssnMeta: ssnRest }, null, 2));
}
