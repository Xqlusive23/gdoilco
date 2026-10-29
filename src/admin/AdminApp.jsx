import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, apiBase, AuthError } from './api.js';
import { DISCIPLINES } from '../data.js';
import './admin.css';

const STATUSES = ['new', 'reviewing', 'shortlisted', 'rejected']; // 'approved' is set only through the Approve checklist
const ALL_STATUSES = ['new', 'reviewing', 'shortlisted', 'approved', 'rejected'];
const CHECKS = [
  ['identity', 'ID checked: the photo ID is clear, not expired, and matches the name and details given'],
  ['ssn', 'Social Security number checked and consistent with the applicant'],
  ['workAuth', 'Authorization to work in the U.S. confirmed'],
  ['credentials', 'Experience and certificates match what the position needs'],
  ['reference', 'Reference contacted and satisfactory'],
];
const fmt = (iso) => { try { return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };

// ---------------------------------------------------------------- sign in
function Login({ onIn }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await adminApi('/login', { method: 'POST', body: { username: u, password: p } }); setP(''); onIn(); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <div className="ad-login">
      <form className="ad-card" onSubmit={submit}>
        <div className="ad-brand">GDoilco <span>Admin</span></div>
        <p className="ad-muted">Authorized staff only. Activity on this site is logged.</p>
        <label>Username<input autoFocus autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required /></label>
        {err && <div className="ad-err" role="alert">{err}</div>}
        <button className="ad-btn primary" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- applications
function Field({ k, children }) { return <div><dt>{k}</dt><dd>{children || <span className="ad-muted">Not given</span>}</dd></div>; }

function IdViewer({ app, side, onAuth }) {
  const [state, setState] = useState({ url: '', type: '', err: '', busy: false });
  useEffect(() => () => { if (state.url) URL.revokeObjectURL(state.url); }, [state.url]);
  const load = async () => {
    setState((s) => ({ ...s, busy: true, err: '' }));
    try {
      const res = await adminApi(`/applications/${app.ref}/id/${side}`, { raw: true });
      const blob = await res.blob();
      setState({ url: URL.createObjectURL(blob), type: blob.type, err: '', busy: false });
    } catch (x) { if (x instanceof AuthError) onAuth(); else setState({ url: '', type: '', err: x.message, busy: false }); }
  };
  if (!app.idUploaded[side]) return <span className="ad-muted">Not uploaded</span>;
  if (!state.url) return <><button className="ad-btn" onClick={load} disabled={state.busy}>{state.busy ? 'Opening...' : `View ${side}`}</button>{state.err && <span className="ad-err inline">{state.err}</span>}</>;
  return (
    <div className="ad-idview">
      {state.type === 'application/pdf'
        ? <a className="ad-btn" href={state.url} target="_blank" rel="noreferrer">Open PDF in a new tab</a>
        : <img src={state.url} alt={`ID ${side}`} />}
      <button className="ad-btn" onClick={() => setState({ url: '', type: '', err: '', busy: false })}>Hide</button>
    </div>
  );
}

const mailLine = (e) => (!e ? 'Not sent yet' : e.ok ? `Sent ${fmt(e.at)}${e.mode === 'outbox' ? ' (saved as a file, not really sent)' : ''}` : `Failed ${fmt(e.at)}: ${e.error || 'unknown error'}`);

// The approval step. Every check must be ticked before the button works; the server enforces this too.
function Approval({ app, setApp, onChanged, onAuth }) {
  const [checks, setChecks] = useState({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({ kind: '', text: '' });
  const all = CHECKS.every(([k]) => checks[k]);
  const approved = app.review.status === 'approved';

  const run = async (label, fn) => {
    setBusy(label); setMsg({ kind: '', text: '' });
    try { await fn(); } catch (x) { if (x instanceof AuthError) onAuth(); else setMsg({ kind: 'err', text: x.message }); }
    setBusy('');
  };
  const approve = () => run('approve', async () => {
    if (!window.confirm(`Approve ${app.fullName} (${app.ref}) and email them now? This cannot be undone.`)) return;
    const r = await adminApi(`/applications/${app.ref}/approve`, { method: 'POST', body: { checklist: checks, note } });
    setApp(r.application); onChanged();
    setMsg(r.email.ok ? { kind: 'ok', text: r.email.mode === 'outbox' ? 'Approved. Email is not set up, so it was saved as a file instead of being sent.' : 'Approved. The applicant has been emailed.' } : { kind: 'err', text: 'Approved, but the email failed: ' + r.email.error + '. Use "Resend" below once the email settings are fixed.' });
  });
  const resend = (type) => run('resend-' + type, async () => {
    const r = await adminApi(`/applications/${app.ref}/resend`, { method: 'POST', body: { type } });
    setApp(r.application);
    setMsg(r.email.ok ? { kind: 'ok', text: 'Email sent again.' } : { kind: 'err', text: 'The email failed: ' + r.email.error });
  });

  return (
    <section className="ad-approval">
      <h3>Approval</h3>
      {approved ? (
        <p className="ad-ok-box">Approved by <b>{app.approval?.by}</b> on {fmt(app.approval?.at)}.</p>
      ) : (
        <>
          <p className="ad-muted small">Check the application thoroughly, then tick each item. All five are needed. Approving emails the applicant at once.</p>
          <div className="ad-checks">
            {CHECKS.map(([k, label]) => (
              <label key={k}><input type="checkbox" checked={!!checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} /> <span>{label}</span></label>
            ))}
          </div>
          <label className="ad-notelabel">Internal note (optional, not included in the email)
            <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="For example: strong A/P background, call on Monday" />
          </label>
          <button className="ad-btn primary" disabled={!all || !!busy} onClick={approve}>{busy === 'approve' ? 'Approving...' : 'Approve and email applicant'}</button>
          {!all && <span className="ad-muted small"> Tick all five checks to enable this.</span>}
        </>
      )}
      {msg.text && <div className={msg.kind === 'ok' ? 'ad-ok-box' : 'ad-err'} role="status">{msg.text}</div>}
      <div className="ad-mails">
        <div><b>Confirmation email</b><span>{mailLine(app.emails?.confirmation)}</span><button className="ad-btn small" disabled={!!busy} onClick={() => resend('confirmation')}>Resend</button></div>
        {approved && <div><b>Approval email</b><span>{mailLine(app.emails?.approval)}</span><button className="ad-btn small" disabled={!!busy} onClick={() => resend('approval')}>Resend</button></div>}
      </div>
      {app.mailMode === 'outbox' && <p className="ad-muted small">Email is not connected yet (no SMTP settings in .env), so emails are saved as pages in <span className="ad-mono">server/data/outbox</span> instead of being sent.</p>}
    </section>
  );
}

function Detail({ ref_, onClose, onChanged, onAuth }) {
  const [app, setApp] = useState(null);
  const [err, setErr] = useState('');
  const [ssn, setSsn] = useState('');
  const [status, setStatus] = useState('new');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    let off = false;
    setApp(null); setSsn(''); setSaved('');
    adminApi('/applications/' + ref_).then((a) => { if (!off) { setApp(a); setStatus(a.review.status); setNote(a.review.note || ''); } })
      .catch((x) => { if (x instanceof AuthError) onAuth(); else setErr(x.message); });
    return () => { off = true; };
  }, [ref_, onAuth]);

  const guard = async (fn) => { try { await fn(); } catch (x) { if (x instanceof AuthError) onAuth(); else setErr(x.message); } };
  const reveal = () => guard(async () => { setErr(''); const r = await adminApi(`/applications/${ref_}/ssn`, { method: 'POST' }); setSsn(r.ssn); });
  const save = () => guard(async () => { setErr(''); const a = await adminApi('/applications/' + ref_, { method: 'PATCH', body: { status, note } }); setApp(a); setSaved('Saved'); onChanged(); });
  const del = () => guard(async () => {
    if (!window.confirm(`Delete application ${ref_} permanently? This removes the saved details, the SSN and the ID images. This cannot be undone.`)) return;
    await adminApi('/applications/' + ref_, { method: 'DELETE' }); onChanged(); onClose();
  });

  return (
    <div className="ad-panel" role="dialog" aria-modal="true" aria-label="Application details">
      <div className="ad-panel-in">
        <div className="ad-panel-head">
          <div><div className="ad-mono">{ref_}</div><h2>{app ? app.fullName : 'Loading...'}</h2></div>
          <button className="ad-btn" onClick={onClose}>Close</button>
        </div>
        {err && <div className="ad-err" role="alert">{err}</div>}
        {app && (
          <>
            <p className="ad-muted">Submitted {fmt(app.submittedAt)}</p>
            <div className="ad-review">
              <label>Status<select value={status} disabled={app.review.status === 'approved'} onChange={(e) => { setStatus(e.target.value); setSaved(''); }}>{(app.review.status === 'approved' ? ALL_STATUSES : STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
              <label className="grow">Internal note<input value={note} maxLength={1000} onChange={(e) => { setNote(e.target.value); setSaved(''); }} placeholder="Only admins see this" /></label>
              <button className="ad-btn primary" onClick={save}>Save</button>
              {saved && <span className="ad-ok">{saved}</span>}
            </div>
            <Approval app={app} setApp={setApp} onChanged={onChanged} onAuth={onAuth} />
            <h3>Applicant</h3>
            <dl className="ad-dl">
              <Field k="Full name">{app.fullName}</Field><Field k="Email"><a href={'mailto:' + app.email}>{app.email}</a></Field>
              <Field k="Phone">{app.phone}</Field><Field k="Lives in">{app.residence}</Field>
              <Field k="Authorized to work in the United States?">{app.authorized}</Field><Field k="Needs sponsorship">{app.sponsorship}</Field>
            </dl>
            <h3>Job</h3>
            <dl className="ad-dl">
              <Field k="Position">{app.position}</Field><Field k="Work type">{app.mode}</Field>
              <Field k="Rotation">{app.rotation}</Field><Field k="Available from">{app.startDate}</Field>
            </dl>
            <h3>Experience</h3>
            <dl className="ad-dl">
              <Field k="Years in industry">{app.years}</Field><Field k="Qualification">{app.qual}</Field>
              <Field k="Most recent role">{app.lastRole}</Field><Field k="Certificates">{(app.certs || []).join(', ')}</Field>
              <Field k="Other certificates">{app.otherCerts}</Field><Field k="Summary">{app.summary}</Field>
            </dl>
            <h3>Identity</h3>
            <dl className="ad-dl">
              <Field k="ID type">{app.idType}</Field>
              <Field k="Social Security number">
                <span className="ad-mono">{ssn || `***-**-${app.ssnLast4}`}</span>{' '}
                {ssn ? <button className="ad-btn small" onClick={() => setSsn('')}>Hide</button> : <button className="ad-btn small" onClick={reveal}>Reveal</button>}
              </Field>
              <Field k="ID, front"><IdViewer app={app} side="front" onAuth={onAuth} /></Field>
              <Field k="ID, back"><IdViewer app={app} side="back" onAuth={onAuth} /></Field>
            </dl>
            <p className="ad-muted small">Revealing the SSN or opening an ID is written to the activity log.</p>
            <h3>Reference</h3>
            <dl className="ad-dl">
              <Field k="Name">{app.refName}</Field><Field k="Phone">{app.refPhone}</Field><Field k="Relationship">{app.refRole}</Field>
            </dl>
            <div className="ad-danger"><button className="ad-btn danger" onClick={del}>Delete this application</button></div>
          </>
        )}
      </div>
    </div>
  );
}

function Applications({ onAuth }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [pos, setPos] = useState('');
  const [st, setSt] = useState('');
  const [open, setOpen] = useState('');

  const load = useCallback(() => {
    adminApi('/applications').then((d) => setRows(d.applications)).catch((x) => { if (x instanceof AuthError) onAuth(); else setErr(x.message); });
  }, [onAuth]);
  useEffect(load, [load]);

  const positions = useMemo(() => [...new Set((rows || []).map((r) => r.position))].sort(), [rows]);
  const shown = useMemo(() => (rows || []).filter((r) => {
    if (pos && r.position !== pos) return false;
    if (st && r.review.status !== st) return false;
    const t = q.trim().toLowerCase();
    return !t || [r.ref, r.fullName, r.email, r.phone, r.position, r.residence].some((x) => String(x).toLowerCase().includes(t));
  }), [rows, q, pos, st]);

  const removeRow = async (r) => {
    if (!window.confirm(`Delete application ${r.ref} from ${r.fullName} permanently? This removes the saved details, the SSN and the ID images. This cannot be undone.`)) return;
    try { await adminApi('/applications/' + r.ref, { method: 'DELETE' }); load(); }
    catch (x) { if (x instanceof AuthError) onAuth(); else setErr(x.message); }
  };
  const exportSsn = (e) => { if (!window.confirm('This file will contain full Social Security numbers. Keep it secure and delete it when you are done. Download it?')) e.preventDefault(); };
  const counts = useMemo(() => Object.fromEntries(ALL_STATUSES.map((s) => [s, (rows || []).filter((r) => r.review.status === s).length])), [rows]);

  if (err) return <div className="ad-err" role="alert">{err}</div>;
  if (!rows) return <p className="ad-muted">Loading applications...</p>;
  return (
    <>
      <div className="ad-stats">
        <div><b>{rows.length}</b><span>Total applications</span></div>
        <div><b>{counts.new}</b><span>New</span></div>
        <div><b>{counts.reviewing + counts.shortlisted}</b><span>In review or shortlisted</span></div>
        <div><b>{counts.approved}</b><span>Approved</span></div>
      </div>
      <div className="ad-toolbar">
        <input type="search" placeholder="Search name, email, phone or ID" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search applications" />
        <select value={pos} onChange={(e) => setPos(e.target.value)} aria-label="Filter by position"><option value="">All positions</option>{positions.map((p) => <option key={p}>{p}</option>)}</select>
        <select value={st} onChange={(e) => setSt(e.target.value)} aria-label="Filter by status"><option value="">All statuses</option>{ALL_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <span className="spacer" />
        <a className="ad-btn" href={apiBase + '/api/admin/export.csv'}>Export CSV</a>
        <a className="ad-btn" href={apiBase + '/api/admin/export.csv?ssn=1'} onClick={exportSsn}>Export CSV with SSN</a>
      </div>
      {shown.length === 0 ? <div className="ad-empty">{rows.length === 0 ? 'No applications yet.' : 'No applications match your search.'}</div> : (
        <div className="ad-tablewrap">
          <table className="ad-table">
            <thead><tr><th>Application ID</th><th>Name</th><th>Position</th><th>Email</th><th>Phone</th><th>Submitted</th><th>Status</th><th><span className="ad-sr">Actions</span></th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.ref} tabIndex={0} onClick={() => setOpen(r.ref)} onKeyDown={(e) => { if (e.key === 'Enter') setOpen(r.ref); }}>
                  <td className="ad-mono">{r.ref}</td><td><b>{r.fullName}</b></td><td>{r.position}</td><td>{r.email}</td><td>{r.phone}</td><td>{fmt(r.submittedAt)}</td>
                  <td><span className={'ad-pill ' + r.review.status}>{r.review.status}</span></td>
                  <td><button className="ad-btn small danger" onClick={(e) => { e.stopPropagation(); removeRow(r); }} aria-label={`Delete application ${r.ref}`}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="ad-muted small">{shown.length} of {rows.length} shown. Click a row to see everything the applicant submitted.</p>
      {open && <Detail ref_={open} onClose={() => setOpen('')} onChanged={load} onAuth={onAuth} />}
    </>
  );
}

// ---------------------------------------------------------------- positions
const BLANK = { role: '', d: 'drilling', site: '', base: '', rot: '', certs: '', st: 'open' };

function Positions({ onAuth }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState(null); // null = hidden; { ref?, ...fields }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminApi('/positions').then((d) => setRows(d.positions)).catch((x) => { if (x instanceof AuthError) onAuth(); else setErr(x.message); });
  }, [onAuth]);
  useEffect(load, [load]);

  const run = async (fn) => { setErr(''); setBusy(true); try { await fn(); await load(); } catch (x) { if (x instanceof AuthError) onAuth(); else setErr(x.message); } setBusy(false); };
  const toggle = (r) => run(() => adminApi('/positions/' + r.ref, { method: 'PUT', body: { st: r.st === 'open' ? 'closed' : 'open' } }));
  const remove = (r) => { if (window.confirm(`Delete "${r.role}" (${r.ref})? Applications already received are kept. To keep the role listed but stop applications, close it instead.`)) run(() => adminApi('/positions/' + r.ref, { method: 'DELETE' })); };
  const save = (e) => {
    e.preventDefault();
    run(async () => {
      if (form.ref) await adminApi('/positions/' + form.ref, { method: 'PUT', body: form });
      else await adminApi('/positions', { method: 'POST', body: form });
      setForm(null);
    });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!rows) return err ? <div className="ad-err" role="alert">{err}</div> : <p className="ad-muted">Loading positions...</p>;
  const sorted = [...rows].sort((a, b) => Number(b.st === 'open') - Number(a.st === 'open'));
  return (
    <>
      <div className="ad-toolbar">
        <span className="ad-muted">{rows.filter((r) => r.st === 'open').length} open, {rows.filter((r) => r.st === 'closed').length} closed. Changes appear on the public site straight away.</span>
        <span className="spacer" />
        <button className="ad-btn primary" onClick={() => setForm({ ...BLANK })}>Add a position</button>
      </div>
      {err && <div className="ad-err" role="alert">{err}</div>}
      {form && (
        <form className="ad-card form" onSubmit={save}>
          <h3>{form.ref ? `Edit ${form.ref}` : 'New position'}</h3>
          <div className="ad-grid">
            <label>Role title<input required maxLength={80} value={form.role} onChange={set('role')} /></label>
            <label>Discipline<select value={form.d} onChange={set('d')}>{Object.entries(DISCIPLINES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
            <label>Unit or site<input required maxLength={100} value={form.site} onChange={set('site')} placeholder="Jack-up rig, Gulf of Mexico" /></label>
            <label>Base<input required maxLength={80} value={form.base} onChange={set('base')} placeholder="Houston, TX" /></label>
            <label>Rotation<input required maxLength={40} value={form.rot} onChange={set('rot')} placeholder="14/14 or Full-time" /></label>
            <label>Certificates needed<input maxLength={200} value={form.certs} onChange={set('certs')} placeholder="SafeGulf, TWIC" /></label>
            <label>Status<select value={form.st} onChange={set('st')}><option value="open">Open for applications</option><option value="closed">Closed</option></select></label>
          </div>
          <div className="ad-row"><button className="ad-btn primary" disabled={busy}>{form.ref ? 'Save changes' : 'Add position'}</button><button type="button" className="ad-btn" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      <div className="ad-tablewrap">
        <table className="ad-table plain">
          <thead><tr><th>Ref</th><th>Role</th><th>Unit and base</th><th>Rotation</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.ref}>
                <td className="ad-mono">{r.ref}</td>
                <td><b>{r.role}</b><small>{DISCIPLINES[r.d]}</small></td>
                <td>{r.site}<small>{r.base}</small></td>
                <td>{r.rot}</td>
                <td><span className={'ad-pill ' + (r.st === 'open' ? 'open' : 'closed')}>{r.st}</span></td>
                <td>
                  <div className="ad-actions">
                    <button className="ad-btn small" disabled={busy} onClick={() => toggle(r)}>{r.st === 'open' ? 'Close' : 'Open'}</button>
                    <button className="ad-btn small" onClick={() => setForm({ ...r })}>Edit</button>
                    <button className="ad-btn small danger" disabled={busy} onClick={() => remove(r)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- activity
function Activity({ onAuth }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { adminApi('/activity').then((d) => setRows(d.entries)).catch((x) => { if (x instanceof AuthError) onAuth(); }); }, [onAuth]);
  if (!rows) return <p className="ad-muted">Loading...</p>;
  return (
    <>
      <p className="ad-muted">Who signed in, what they opened, exported or changed. The log never contains the applicants' details.</p>
      <div className="ad-tablewrap">
        <table className="ad-table plain">
          <thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Item</th><th>From</th></tr></thead>
          <tbody>{rows.map((e, i) => <tr key={i}><td>{fmt(e.at)}</td><td>{e.user}</td><td>{e.action.replace(/_/g, ' ')}</td><td className="ad-mono">{e.ref}</td><td className="ad-mono">{e.ip}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- shell
export default function AdminApp() {
  const [user, setUser] = useState(undefined); // undefined = checking, '' = signed out
  const [tab, setTab] = useState('applications');

  useEffect(() => {
    document.title = 'Admin | GDoilco';
    let m = document.querySelector('meta[name="robots"]');
    if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); }
    m.content = 'noindex, nofollow';
    adminApi('/me').then((d) => setUser(d.user)).catch(() => setUser(''));
  }, []);

  const out = useCallback(() => setUser(''), []);
  const logout = async () => { try { await adminApi('/logout', { method: 'POST' }); } catch { /* already out */ } setUser(''); };

  if (user === undefined) return <div className="ad-root"><p className="ad-muted pad">Loading...</p></div>;
  if (!user) return <div className="ad-root"><Login onIn={() => adminApi('/me').then((d) => setUser(d.user)).catch(() => setUser(''))} /></div>;
  return (
    <div className="ad-root">
      <header className="ad-top">
        <div className="ad-brand">GDoilco <span>Admin</span></div>
        <nav aria-label="Admin sections">
          {[['applications', 'Applications'], ['positions', 'Positions'], ['activity', 'Activity']].map(([k, n]) => (
            <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{n}</button>
          ))}
        </nav>
        <div className="ad-user">{user}<button className="ad-btn small" onClick={logout}>Sign out</button></div>
      </header>
      <main className="ad-main">
        {tab === 'applications' && <Applications onAuth={out} />}
        {tab === 'positions' && <Positions onAuth={out} />}
        {tab === 'activity' && <Activity onAuth={out} />}
      </main>
    </div>
  );
}
