// File-based storage: applications, encrypted ID images, the list of positions, duplicate fingerprints, audit log.
// Everything lives under DATA_DIR. Writes are synchronous, so the duplicate check and the save cannot interleave.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { decrypt } from './crypto.js';
import { DISCIPLINES } from '../src/data.js';

export const REF_RE = /^GD-\d{6}-[0-9A-F]{6}$/;
// 'approved' is not in this list on purpose: it can only be set through the approval checklist (POST .../approve).
export const STATUSES = ['new', 'reviewing', 'shortlisted', 'rejected'];

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

function writeAtomic(file, text) {
  const tmp = file + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  fs.writeFileSync(tmp, text, { mode: 0o600 });
  fs.renameSync(tmp, file);
}

// The same person can write an email in several ways. Lowercase it and drop a "+tag" so a+1@x.com equals a@x.com.
export function normalizeEmail(email) {
  const [local = '', domain = ''] = String(email).trim().toLowerCase().split('@');
  return `${local.split('+')[0]}@${domain}`;
}

export function createStore({ dataDir, key, seedRoles }) {
  const APPS = path.join(dataDir, 'applications');
  const IDS = path.join(dataDir, 'ids');
  const POS = path.join(dataDir, 'positions.json');
  const AUDIT = path.join(dataDir, 'audit.log');
  for (const d of [dataDir, APPS, IDS]) fs.mkdirSync(d, { recursive: true, mode: 0o700 });

  // ---------- positions ----------
  let positions;
  try { positions = JSON.parse(fs.readFileSync(POS, 'utf8')); } catch { positions = null; }
  if (!Array.isArray(positions)) {
    positions = seedRoles.map((r) => ({ ...r }));
    writeAtomic(POS, JSON.stringify(positions, null, 2));
  }
  const savePositions = () => writeAtomic(POS, JSON.stringify(positions, null, 2));

  function checkPosition(input) {
    const p = {
      role: clean(input.role, 80), d: clean(input.d, 20), site: clean(input.site, 100), base: clean(input.base, 80),
      rot: clean(input.rot, 40), certs: clean(input.certs, 200), st: clean(input.st, 10),
    };
    for (const k of ['role', 'site', 'base', 'rot']) if (!p[k]) return { error: 'Fill in the role, site, base and rotation.' };
    if (!DISCIPLINES[p.d]) return { error: 'Choose a discipline from the list.' };
    if (!['open', 'closed'].includes(p.st)) return { error: 'Status must be open or closed.' };
    return { value: p };
  }
  const nextRef = () => {
    const max = positions.reduce((m, r) => Math.max(m, Number((r.ref.match(/\d+$/) || [0])[0])), 1000);
    return 'GD-' + (max + 1);
  };

  // ---------- fingerprints (one application per person) ----------
  const fp = (kind, value) => crypto.createHmac('sha256', key).update(kind + ':' + value).digest('hex');
  const seen = { ssn: new Map(), email: new Map() };
  function index(rec) {
    let f = rec.fp;
    if (!f) {
      try {
        const ssn = decrypt(key, Buffer.from(rec.ssn.enc, 'base64')).toString('utf8');
        f = { ssn: fp('ssn', ssn), email: fp('email', normalizeEmail(rec.email)) };
      } catch { return; }
    }
    seen.ssn.set(f.ssn, rec.ref);
    seen.email.set(f.email, rec.ref);
  }
  for (const name of fs.readdirSync(APPS)) {
    if (!name.endsWith('.json')) continue;
    try { index(JSON.parse(fs.readFileSync(path.join(APPS, name), 'utf8'))); } catch { /* skip unreadable file */ }
  }

  const readApp = (ref) => {
    if (!REF_RE.test(ref)) return null;
    try { return JSON.parse(fs.readFileSync(path.join(APPS, ref + '.json'), 'utf8')); } catch { return null; }
  };

  return {
    IDS,
    // positions
    listPositions: () => positions,
    getPosition: (ref) => positions.find((r) => r.ref === ref) || null,
    createPosition(input) {
      const c = checkPosition(input);
      if (c.error) return c;
      const row = { ref: nextRef(), ...c.value };
      positions.push(row);
      savePositions();
      return { value: row };
    },
    updatePosition(ref, input) {
      const i = positions.findIndex((r) => r.ref === ref);
      if (i < 0) return { error: 'Position not found.', status: 404 };
      const c = checkPosition({ ...positions[i], ...input });
      if (c.error) return c;
      positions[i] = { ref, ...c.value };
      savePositions();
      return { value: positions[i] };
    },
    deletePosition(ref) {
      const i = positions.findIndex((r) => r.ref === ref);
      if (i < 0) return false;
      positions.splice(i, 1);
      savePositions();
      return true;
    },

    // applications
    fingerprints: (ssn, email) => ({ ssn: fp('ssn', ssn), email: fp('email', normalizeEmail(email)) }),
    isDuplicate: (f) => seen.ssn.has(f.ssn) || seen.email.has(f.email),
    refExists: (ref) => fs.existsSync(path.join(APPS, ref + '.json')),
    saveApplication(rec) {
      writeAtomic(path.join(APPS, rec.ref + '.json'), JSON.stringify(rec, null, 2));
      index(rec);
    },
    getApplication: readApp,
    listApplications() {
      const out = [];
      for (const name of fs.readdirSync(APPS)) {
        if (!name.endsWith('.json')) continue;
        try { out.push(JSON.parse(fs.readFileSync(path.join(APPS, name), 'utf8'))); } catch { /* skip */ }
      }
      return out.sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
    },
    // Change one saved application: store.updateRecord(ref, (rec) => { rec.x = 1; })
    updateRecord(ref, mutate) {
      const rec = readApp(ref);
      if (!rec) return null;
      mutate(rec);
      writeAtomic(path.join(APPS, ref + '.json'), JSON.stringify(rec, null, 2));
      return rec;
    },
    updateReview(ref, { status, note }) {
      const rec = readApp(ref);
      if (!rec) return null;
      if (!STATUSES.includes(status)) return { error: 'Unknown status.' };
      rec.review = { status, note: clean(note, 1000), updatedAt: new Date().toISOString() };
      writeAtomic(path.join(APPS, ref + '.json'), JSON.stringify(rec, null, 2));
      return rec;
    },
    deleteApplication(ref) {
      const rec = readApp(ref);
      if (!rec) return false;
      for (const name of Object.values(rec.idFiles || {})) fs.rmSync(path.join(IDS, path.basename(name)), { force: true });
      fs.rmSync(path.join(APPS, ref + '.json'), { force: true });
      for (const m of [seen.ssn, seen.email]) for (const [k, v] of m) if (v === ref) m.delete(k);
      return true;
    },

    // audit log: who did what, never the data itself
    audit(action, { user = '-', ref = '', ip = '' } = {}) {
      try { fs.appendFileSync(AUDIT, JSON.stringify({ at: new Date().toISOString(), action, user, ref, ip }) + '\n', { mode: 0o600 }); } catch { /* best effort */ }
    },
    readAudit(limit = 200) {
      try {
        const lines = fs.readFileSync(AUDIT, 'utf8').split('\n').filter(Boolean).slice(-limit).reverse();
        return lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      } catch { return []; }
    },
  };
}
