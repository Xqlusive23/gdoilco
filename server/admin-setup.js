// Creates or resets the admin login:  npm run admin:setup
// Saves the username and a salted scrypt hash of the password in DATA_DIR/admin.json. The password itself is never stored.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { hashPassword } from './password.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(here, '..', process.env.DATA_DIR || './server/data');
const username = process.env.ADMIN_USERNAME || (await ask('Admin username: ')).trim();
const email = process.env.ADMIN_EMAIL || (await ask('Admin email: ')).trim();
const password = process.env.ADMIN_PASSWORD || (await ask('Admin password: ')).trim();

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); else if (s === '\r\n' || s === '\n') rl.output.write(s); };
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

const username = (await ask('Admin username: ')).trim();
if (!/^[A-Za-z0-9._-]{3,40}$/.test(username)) { console.error('Use 3 to 40 letters, numbers, dots, dashes or underscores.'); process.exit(1); }
const pw = await ask('Admin password (at least 12 characters): ', true);
const again = await ask('Repeat the password: ', true);
if (pw !== again) { console.error('The passwords do not match.'); process.exit(1); }
if (pw.length < 12) { console.error('The password must be at least 12 characters.'); process.exit(1); }

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(DATA_DIR, 'admin.json'), JSON.stringify({ username, ...hashPassword(pw), createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
console.log('Saved. Start the server and open /admin to sign in.');
