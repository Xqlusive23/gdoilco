// Admin API. Everything except /login needs a signed-in admin session.
// Protections: scrypt password check, rate-limited sign-in, random session tokens in an httpOnly SameSite=Strict cookie,
// a same-origin check plus a required header on every change (CSRF), and an audit log of what was viewed or changed.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { decrypt } from './crypto.js';
import { checkPassword } from './password.js';
import { REF_RE, STATUSES } from './store.js';

const COOKIE = 'gd_admin';
const ABSOLUTE_MS = 8 * 3600e3;
const IDLE_MS = 30 * 60e3;
const MIME = { jpg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' };

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readCookie(req, name) {
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

// Spreadsheet programs run text that starts with = + - @ as a formula. Defuse it.
function csvCell(v) {
  let s = Array.isArray(v) ? v.join('; ') : String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function createAdminRouter({ store, key, dataDir }) {
  const r = express.Router();
  const sessions = new Map(); // sha256(token) -> { user, created, last }
  const fails = new Map(); // ip -> [timestamps]

  const credentials = () => {
    try { return JSON.parse(fs.readFileSync(path.join(dataDir, 'admin.json'), 'utf8')); } catch { return null; }
  };
  const blocked = (ip) => (fails.get(ip) || []).filter((t) => Date.now() - t < 15 * 60e3).length >= 5;
  const addFail = (ip) => fails.set(ip, [...(fails.get(ip) || []).filter((t) => Date.now() - t < 15 * 60e3), Date.now()]);

  setInterval(() => {
    const now = Date.now();
    for (const [k, s] of sessions) if (now - s.created > ABSOLUTE_MS || now - s.last > IDLE_MS) sessions.delete(k);
  }, 60e3).unref();

  r.use(express.json({ limit: '100kb' }));

  // Same-origin only for anything that changes data.
  r.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      const origin = req.get('origin');
      if (origin) {
        let host = '';
        try { host = new URL(origin).host; } catch { /* bad origin */ }
        const fwd = req.app.get('trust proxy') ? String(req.get('x-forwarded-host') || '').split(',')[0].trim() : '';
        if (host !== (fwd || req.get('host'))) return res.status(403).json({ error: 'Forbidden.' });
      }
      if (req.get('x-requested-with') !== 'gdoilco-admin') return res.status(403).json({ error: 'Forbidden.' });
    }
    next();
  });

  function setCookie(req, res, token, maxAgeMs) {
    const secure = req.secure ? '; Secure' : '';
    res.set('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`);
  }

  r.post('/login', async (req, res) => {
    const ip = req.ip;
    if (blocked(ip)) return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    const { username, password } = req.body || {};
    const cred = credentials();
    if (!cred) return res.status(503).json({ error: 'No admin account yet. Run "npm run admin:setup" on the server.' });
    const okUser = typeof username === 'string' && username.length < 100 && username.toLowerCase() === String(cred.username).toLowerCase();
    const okPass = checkPassword(typeof password === 'string' && password.length < 500 ? password : '', cred.salt, cred.hash);
    if (!(okUser && okPass)) {
      addFail(ip);
      store.audit('login_failed', { ip });
      await sleep(400);
      return res.status(401).json({ error: 'Wrong username or password.' });
    }
    fails.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(sha(token), { user: cred.username, created: Date.now(), last: Date.now() });
    setCookie(req, res, token, ABSOLUTE_MS);
    store.audit('login', { user: cred.username, ip });
    res.json({ ok: true, user: cred.username });
  });

  function auth(req, res, next) {
    const token = readCookie(req, COOKIE);
    const s = token && sessions.get(sha(token));
    const now = Date.now();
    if (!s || now - s.created > ABSOLUTE_MS || now - s.last > IDLE_MS) {
      if (s) sessions.delete(sha(token));
      return res.status(401).json({ error: 'Please sign in.' });
    }
    s.last = now;
    req.admin = { user: s.user, token };
    next();
  }

  r.get('/me', auth, (req, res) => res.json({ user: req.admin.user }));
  r.post('/logout', auth, (req, res) => {
    sessions.delete(sha(req.admin.token));
    setCookie(req, res, '', 0);
    store.audit('logout', { user: req.admin.user, ip: req.ip });
    res.json({ ok: true });
  });

  const log = (req, action, ref = '') => store.audit(action, { user: req.admin.user, ref, ip: req.ip });
  const last4 = (rec) => rec.ssn?.last4 || '';
  const view = (rec) => {
    const { ssn, idFiles, fp, ...rest } = rec;
    return { ...rest, ssnLast4: last4(rec), idUploaded: { front: !!idFiles?.front, back: !!idFiles?.back }, review: rec.review || { status: 'new', note: '' } };
  };

  // ----- applications -----
  r.get('/applications', auth, (req, res) => res.json({ applications: store.listApplications().map(view) }));

  r.get('/applications/:ref', auth, (req, res) => {
    const rec = store.getApplication(req.params.ref);
    if (!rec) return res.status(404).json({ error: 'Not found.' });
    log(req, 'view_application', rec.ref);
    res.json(view(rec));
  });

  r.post('/applications/:ref/ssn', auth, (req, res) => {
    const rec = store.getApplication(req.params.ref);
    if (!rec) return res.status(404).json({ error: 'Not found.' });
    try {
      const d = decrypt(key, Buffer.from(rec.ssn.enc, 'base64')).toString('utf8');
      log(req, 'reveal_ssn', rec.ref);
      res.json({ ssn: `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` });
    } catch { res.status(500).json({ error: 'Could not decrypt. Check SSN_ENCRYPTION_KEY.' }); }
  });

  r.get('/applications/:ref/id/:side', auth, (req, res) => {
    const rec = store.getApplication(req.params.ref);
    const name = rec?.idFiles?.[req.params.side === 'back' ? 'back' : req.params.side === 'front' ? 'front' : ''];
    if (!name) return res.status(404).json({ error: 'No such file.' });
    try {
      const plain = decrypt(key, fs.readFileSync(path.join(store.IDS, path.basename(name))));
      const ext = name.replace(/\.enc$/, '').split('.').pop();
      log(req, 'view_id_' + req.params.side, rec.ref);
      res.set({
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${rec.ref}-${req.params.side}.${ext}"`,
        'Content-Security-Policy': ext === 'pdf' ? "default-src 'none'" : "default-src 'none'; sandbox",
        'X-Content-Type-Options': 'nosniff',
      });
      res.send(plain);
    } catch { res.status(500).json({ error: 'Could not read the file.' }); }
  });

  r.patch('/applications/:ref', auth, (req, res) => {
    const { status, note } = req.body || {};
    const out = store.updateReview(req.params.ref, { status, note });
    if (!out) return res.status(404).json({ error: 'Not found.' });
    if (out.error) return res.status(400).json({ error: out.error });
    log(req, 'review_' + status, req.params.ref);
    res.json(view(out));
  });

  r.delete('/applications/:ref', auth, (req, res) => {
    if (!REF_RE.test(req.params.ref) || !store.deleteApplication(req.params.ref)) return res.status(404).json({ error: 'Not found.' });
    log(req, 'delete_application', req.params.ref);
    res.json({ ok: true });
  });

  const COLUMNS = [
    ['Application ID', 'ref'], ['Submitted (UTC)', 'submittedAt'], ['Status', (a) => a.review?.status || 'new'], ['Full name', 'fullName'], ['Email', 'email'], ['Phone', 'phone'],
    ['Lives in', 'residence'], ['Authorized to work in U.S.', 'authorized'], ['Needs sponsorship', 'sponsorship'], ['Position', 'position'], ['Work type', 'mode'],
    ['Rotation', 'rotation'], ['Available from', 'startDate'], ['Years in industry', 'years'], ['Qualification', 'qual'], ['Most recent role', 'lastRole'],
    ['Certificates', 'certs'], ['Other certificates', 'otherCerts'], ['Summary', 'summary'], ['ID type', 'idType'], ['SSN last 4', (a) => last4(a)],
    ['Reference name', 'refName'], ['Reference phone', 'refPhone'], ['Reference relationship', 'refRole'], ['Admin note', (a) => a.review?.note || ''],
  ];

  r.get('/export.csv', auth, (req, res) => {
    const withSsn = req.query.ssn === '1';
    const cols = withSsn ? [...COLUMNS, ['Full SSN', (a) => { try { return decrypt(key, Buffer.from(a.ssn.enc, 'base64')).toString('utf8'); } catch { return ''; } }]] : COLUMNS;
    const apps = store.listApplications();
    const rows = [cols.map((c) => csvCell(c[0])).join(',')];
    for (const a of apps) rows.push(cols.map(([, f]) => csvCell(typeof f === 'function' ? f(a) : a[f])).join(','));
    log(req, withSsn ? 'export_csv_with_ssn' : 'export_csv', `${apps.length} rows`);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gdoilco-applications-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
    res.send('﻿' + rows.join('\r\n') + '\r\n');
  });

  // ----- positions -----
  r.get('/positions', auth, (req, res) => res.json({ positions: store.listPositions() }));
  r.post('/positions', auth, (req, res) => {
    const out = store.createPosition(req.body || {});
    if (out.error) return res.status(400).json({ error: out.error });
    log(req, 'position_create', out.value.ref);
    res.status(201).json(out.value);
  });
  r.put('/positions/:ref', auth, (req, res) => {
    const out = store.updatePosition(req.params.ref, req.body || {});
    if (out.error) return res.status(out.status || 400).json({ error: out.error });
    log(req, 'position_update_' + out.value.st, out.value.ref);
    res.json(out.value);
  });
  r.delete('/positions/:ref', auth, (req, res) => {
    if (!store.deletePosition(req.params.ref)) return res.status(404).json({ error: 'Not found.' });
    log(req, 'position_delete', req.params.ref);
    res.json({ ok: true });
  });

  r.get('/activity', auth, (req, res) => res.json({ entries: store.readAudit(300) }));
  r.get('/meta', auth, (req, res) => res.json({ statuses: STATUSES }));

  r.use((req, res) => res.status(404).json({ error: 'Not found.' }));
  return r;
}
