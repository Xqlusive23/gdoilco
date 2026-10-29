// Creates or resets the admin login:  npm run admin:setup
// Saves the username and a salted scrypt hash of the password in DATA_DIR/admin.json. The password itself is never stored.
//
// Interactive (local terminal):  npm run admin:setup
// Non-interactive (Railway etc.): set ADMIN_USERNAME and ADMIN_PASSWORD, then run it.
//   - If admin.json already exists, it is left alone unless ADMIN_RESET=true.
//   - Remove ADMIN_PASSWORD from your environment after the first successful run.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './password.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(here, '..', process.env.DATA_DIR || './server/data');
const ADMIN_FILE = path.join(DATA_DIR, 'admin.json');

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); else if (s === '\r\n' || s === '\n') rl.output.write(s); };
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

const envUser = (process.env.ADMIN_USERNAME || '').trim();
const envPass = process.env.ADMIN_PASSWORD || '';
const nonInteractive = Boolean(envUser && envPass);

let username, pw;

if (nonInteractive) {
  if (fs.existsSync(ADMIN_FILE) && process.env.ADMIN_RESET !== 'true') {
    console.log(`Admin already exists at ${ADMIN_FILE}. Set ADMIN_RESET=true to overwrite. Skipping.`);
    process.exit(0);
  }
  username = envUser;
  pw = envPass;
} else if (!process.stdin.isTTY) {
  console.error('No terminal available. Set ADMIN_USERNAME and ADMIN_PASSWORD, or run this from an interactive shell.');
  process.exit(1);
} else {
  username = (await ask('Admin username: ')).trim();
  pw = await ask('Admin password (at least 12 characters): ', true);
  const again = await ask('Repeat the password: ', true);
  if (pw !== again) { console.error('The passwords do not match.'); process.exit(1); }
}

if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) { console.error('Use 3 to 40 letters, numbers, dots, dashes or underscores.'); process.exit(1); }
if (pw.length < 12) { console.error('The password must be at least 12 characters.'); process.exit(1); }

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
fs.writeFileSync(ADMIN_FILE, JSON.stringify({ username, ...hashPassword(pw), createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
console.log('Saved. Start the server and open /admin to sign in.');