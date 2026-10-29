// GDoilco application server.
// Receives the application form, checks it again on the server, encrypts the SSN and the ID images,
// and saves everything under DATA_DIR. It never logs form contents.
import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encrypt, loadKey } from './crypto.js';
import { createStore } from './store.js';
import { createAdminRouter } from './admin.js';
import { createMailer } from './mailer.js';
import { hashPassword } from './password.js';
import { ROLES, CONTACT } from '../src/data.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
const DATA_DIR = path.resolve(here, '..', process.env.DATA_DIR || './server/data');
const MAX_FILE = 8 * 1024 * 1024;

let KEY;
try { KEY = loadKey(); } catch (e) { console.error(e.message); process.exit(1); }
// On a host where you cannot run "npm run admin:setup" (Railway, Render...): set ADMIN_USERNAME and ADMIN_PASSWORD once.
// The account is created on first start if none exists. Afterwards delete ADMIN_PASSWORD from the host's variables.
{
  const file = path.join(DATA_DIR, 'admin.json');
  const u = (process.env.ADMIN_USERNAME || '').trim(), pw = process.env.ADMIN_PASSWORD || '';
  if (!fs.existsSync(file) && u && pw) {
    if (!/^[A-Za-z0-9._-]{3,40}$/.test(u) || pw.length < 12) console.error('ADMIN_USERNAME or ADMIN_PASSWORD is not valid (username 3 to 40 letters, numbers . _ -; password at least 12 characters). No admin account was created.');
    else { fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 }); fs.writeFileSync(file, JSON.stringify({ username: u, ...hashPassword(pw), createdAt: new Date().toISOString() }, null, 2), { mode: 0o600 }); console.log('Admin account created for ' + u + '. Remove ADMIN_PASSWORD from your variables now.'); }
  }
}
const store = createStore({ dataDir: DATA_DIR, key: KEY, seedRoles: ROLES });
const mailer = createMailer({ dataDir: DATA_DIR });
console.log(mailer.live ? `Emails are sent through ${process.env.SMTP_HOST}.` : 'No SMTP_HOST in .env: emails are saved as web pages in the outbox folder instead of being sent.');

const app = express();
app.disable('x-powered-by');
// Set TRUST_PROXY=1 when the server sits behind a proxy or host (Render, Nginx...) so client IPs and https are read correctly.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
if (process.env.ALLOWED_ORIGIN) app.use(cors({ origin: process.env.ALLOWED_ORIGIN.split(',').map((s) => s.trim()) }));
app.use('/api', (req, res, next) => {
  res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  next();
});

// Allow 10 submissions per hour from one address.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 10;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE, files: 2, fields: 6, fieldSize: 64 * 1024 },
}).fields([{ name: 'idFront', maxCount: 1 }, { name: 'idBack', maxCount: 1 }]);

function fileKind(buf) {
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  return null;
}

function validSsn(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length !== 9) return null;
  const area = d.slice(0, 3), group = d.slice(3, 5), serial = d.slice(5);
  if (area === '000' || area === '666' || area[0] === '9' || group === '00' || serial === '0000') return null;
  return d;
}

const REQUIRED = ['fullName', 'email', 'phone', 'residence', 'authorized', 'sponsorship', 'position', 'mode', 'years', 'qual', 'lastRole', 'refName', 'refPhone'];
const clean = (v, max = 600) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

function newRef() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const tail = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `GD-${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${tail}`;
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

// The live list of positions. The admin site edits it; the public pages read it.
app.get('/api/positions', (req, res) => res.json({ positions: store.listPositions() }));

app.use('/api/admin', createAdminRouter({ store, key: KEY, dataDir: DATA_DIR, mailer }));

app.post('/api/applications', (req, res) => {
  if (limited(req.ip)) return res.status(429).json({ error: 'Too many applications from this connection. Please try again later.' });
  upload(req, res, (uploadError) => {
    if (uploadError) {
      const big = uploadError.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({ error: big ? 'Each ID file must be 8 MB or smaller.' : 'The upload could not be read.' });
    }
    try {
      let a;
      try { a = JSON.parse(req.body.application || '{}'); } catch { a = null; }
      if (!a || typeof a !== 'object') return res.status(400).json({ error: 'The application could not be read.' });

      const f = {};
      for (const k of ['fullName', 'email', 'phone', 'residence', 'authorized', 'sponsorship', 'position', 'mode', 'rotation', 'startDate', 'years', 'qual', 'lastRole', 'otherCerts', 'summary', 'refName', 'refPhone', 'refRole', 'idType']) f[k] = clean(a[k] ?? req.body[k]);
      f.certs = Array.isArray(a.certs) ? a.certs.map((c) => clean(c, 80)).slice(0, 20) : [];
      for (const k of REQUIRED) if (!f[k]) return res.status(400).json({ error: 'Some required details are missing.' });
      if (!f.certs.length) return res.status(400).json({ error: 'Choose your certificates, or None.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      if (a.truth !== true || a.consent !== true) return res.status(400).json({ error: 'Both confirmations are required.' });

      const ref = (f.position.match(/\((GD-\d+)\)\s*$/) || [])[1];
      const role = store.getPosition(ref);
      if (!role || role.st !== 'open') return res.status(400).json({ error: 'That position is not open for applications.' });

      const ssn = validSsn(req.body.ssn);
      if (!ssn) return res.status(400).json({ error: 'Enter a valid 9-digit Social Security number.' });
      if (!f.idType) return res.status(400).json({ error: 'Choose the type of ID you are uploading.' });

      const front = req.files?.idFront?.[0];
      const back = req.files?.idBack?.[0];
      if (!front) return res.status(400).json({ error: 'Upload a photo or scan of the front of your ID.' });
      const kinds = {};
      for (const [name, file] of [['front', front], ['back', back]]) {
        if (!file) continue;
        const kind = fileKind(file.buffer);
        if (!kind) return res.status(400).json({ error: 'ID files must be a JPG, PNG or PDF.' });
        kinds[name] = kind;
      }

      // One application per person: the same Social Security number or email cannot apply twice.
      const fingerprints = store.fingerprints(ssn, f.email);
      if (store.isDuplicate(fingerprints)) {
        return res.status(409).json({ error: `An application with this Social Security number or email address has already been received. Only one application per person is accepted. Questions? Contact ${CONTACT.email}.` });
      }

      const submittedAt = new Date().toISOString();
      let id = newRef();
      while (store.refExists(id)) id = newRef();

      const files = {};
      for (const [name, file] of [['front', front], ['back', back]]) {
        if (!file) continue;
        const fname = `${id}-${name}.${kinds[name]}.enc`;
        fs.writeFileSync(path.join(store.IDS, fname), encrypt(KEY, file.buffer), { mode: 0o600 });
        files[name] = fname;
      }
      const record = {
        ref: id, submittedAt, ...f,
        ssn: { last4: ssn.slice(-4), enc: encrypt(KEY, Buffer.from(ssn, 'utf8')).toString('base64') },
        idFiles: files,
        fp: fingerprints,
        review: { status: 'new', note: '' },
      };
      store.saveApplication(record);
      // Confirmation email goes out in the background so the applicant is not kept waiting.
      mailer.send('confirmation', { fullName: f.fullName, email: f.email, ref: id, position: f.position, submittedAt }).then((r) => {
        store.updateRecord(id, (x) => { x.emails = { ...(x.emails || {}), confirmation: { ok: r.ok, mode: r.mode, at: new Date().toISOString(), error: r.error || undefined } }; });
      }).catch(() => {});
      console.log(`Application ${id} saved for ${role.role}`);
      return res.status(201).json({ ok: true, ref: id, submittedAt });
    } catch (e) {
      console.error('Could not save an application:', e.code || e.name);
      return res.status(500).json({ error: 'The application could not be saved. Please try again.' });
    }
  });
});

// Production: serve the built website from the same process.
const dist = path.join(here, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use((req, res, next) => {
    res.set({
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      // Pexels serves the photos and videos. Smartsupp (live chat) needs its three domains.
      'Content-Security-Policy': "default-src 'self'; script-src 'self' https://*.smartsuppchat.com https://*.smartsuppcdn.com; img-src 'self' data: blob: https://images.pexels.com https://*.smartsuppcdn.com; media-src 'self' blob: https://videos.pexels.com https://*.pexels.com https://*.smartsuppcdn.com; style-src 'self' 'unsafe-inline' https://*.smartsuppcdn.com; font-src 'self' data: https://*.smartsuppcdn.com; connect-src 'self' https://*.smartsupp.com wss://*.smartsupp.com https://*.smartsuppchat.com https://*.smartsuppcdn.com; frame-src https://*.smartsuppchat.com https://*.smartsupp.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    });
    next();
  });
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(PORT, () => console.log(`GDoilco server listening on http://localhost:${PORT}`));
