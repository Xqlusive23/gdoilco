import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import { CONTACT, isOpen } from '../data.js';
import { usePositions } from '../lib/positions.js';
import { downloadText, submitApplication, summaryText } from '../lib/submit.js';

const CERTS = ['TWIC card', 'Offshore survival (HUET)', 'SafeGulf or SEMS orientation', 'IADC WellSharp', 'H2S awareness', 'Crane or rigging certification', 'First aid and CPR', 'OSHA 10 or 30', 'USCG MMC or STCW', 'Food manager certification'];
const ID_TYPES = ["Driver's license", 'State ID card', 'U.S. passport', 'Other government photo ID'];
const FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE = 8 * 1024 * 1024;
const CHOICE = ['mode', 'authorized', 'sponsorship'];

const SECTIONS = [
  { id: 'sec1', title: 'About you', required: ['fullName', 'email', 'phone', 'residence', 'authorized', 'sponsorship'] },
  { id: 'sec2', title: 'The job', required: ['position', 'mode'] },
  { id: 'sec3', title: 'Experience', required: ['years', 'qual', 'lastRole', 'certs'] },
  { id: 'sec4', title: 'Identity', required: ['ssn', 'idType', 'idFront'] },
  { id: 'sec5', title: 'Reference', required: ['refName', 'refPhone', 'truth', 'consent'] },
];
const REQUIRED = SECTIONS.flatMap((s) => s.required);

const EMPTY = {
  fullName: '', email: '', phone: '', residence: '', authorized: '', sponsorship: '',
  position: '', mode: '', rotation: 'No preference', startDate: '',
  years: '', qual: '', lastRole: '', certs: [], otherCerts: '', summary: '',
  ssn: '', idType: '', idFront: null, idBack: null,
  refName: '', refPhone: '', refRole: '', truth: false, consent: false,
};

function ssnProblem(s) {
  const d = s.replace(/\D/g, '');
  if (d.length !== 9) return 'Enter your 9-digit Social Security number.';
  if (d.slice(0, 3) === '000' || d.slice(0, 3) === '666' || d[0] === '9' || d.slice(3, 5) === '00' || d.slice(5) === '0000') return 'That is not a valid Social Security number.';
  return '';
}

function fileProblem(f, required) {
  if (!f) return required ? 'Upload a photo or scan of your ID.' : '';
  if (!FILE_TYPES.includes(f.type)) return 'Use a JPG, PNG or PDF file.';
  if (f.size > MAX_FILE) return 'The file must be 8 MB or smaller.';
  return '';
}

function check(name, v) {
  const required = REQUIRED.includes(name);
  if (name === 'idFront' || name === 'idBack') return fileProblem(v, required);
  if (Array.isArray(v)) return required && v.length === 0 ? 'Choose at least one option, or None.' : '';
  if (typeof v === 'boolean') return required && !v ? 'This confirmation is required.' : '';
  const s = String(v).trim();
  if (name === 'ssn') return s ? ssnProblem(s) : 'Enter your 9-digit Social Security number.';
  if (!s) return required ? (CHOICE.includes(name) ? 'Choose one option.' : 'This field is required.') : '';
  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return 'Enter a valid email address.';
  if ((name === 'phone' || name === 'refPhone') && s.replace(/\D/g, '').length < 10) return 'Enter a 10-digit phone number.';
  return '';
}

const formatSsn = (raw) => {
  const d = raw.replace(/\D/g, '').slice(0, 9);
  if (d.length > 5) return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  if (d.length > 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return d;
};
const prettySize = (n) => (n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');

function Field({ id, label, required, error, hint, children }) {
  return (
    <div className={'field' + (error ? ' bad' : '')}>
      {id ? <label htmlFor={id}>{label}{required && <span className="req" aria-hidden="true"> *</span>}</label>
          : <div className="lab">{label}{required && <span className="req" aria-hidden="true"> *</span>}</div>}
      {children}
      {hint && <small>{hint}</small>}
      <div className="err" role="alert">{error}</div>
    </div>
  );
}

function FileDrop({ id, file, onFile }) {
  const [over, setOver] = useState(false);
  const ref = useRef(null);
  const clear = () => { if (ref.current) ref.current.value = ''; onFile(null); };
  return (
    <div
      className={'drop' + (over ? ' over' : '') + (file ? ' has' : '')}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
    >
      <input ref={ref} id={id} className="drop-input" type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => onFile(e.target.files?.[0] || null)} />
      {file ? (
        <div className="drop-file">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6" /></svg>
          <span className="drop-name">{file.name}<small>{prettySize(file.size)}</small></span>
          <button type="button" className="copy" onClick={clear}>Remove</button>
        </div>
      ) : (
        <label htmlFor={id} className="drop-cta">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 20h16" /></svg>
          <span><b>Choose a file</b> or drag it here<small>JPG, PNG or PDF, up to 8 MB</small></span>
        </label>
      )}
    </div>
  );
}

export default function Apply() {
  const { roles, loading } = usePositions();
  const OPEN_ROLES = useMemo(() => roles.filter(isOpen), [roles]);
  if (loading) {
    return <Hero photo="glow" scene="rise" rigX={0.62} eyebrow="Application form" title="Apply for a rotation." lede="Loading the open positions." />;
  }
  return <ApplyForm openRoles={OPEN_ROLES} />;
}

function ApplyForm({ openRoles: OPEN_ROLES }) {
  const [params] = useSearchParams();
  const initialPosition = useMemo(() => {
    const wanted = OPEN_ROLES.find((x) => x.ref === (params.get('role') || '').toUpperCase());
    const r = wanted || (OPEN_ROLES.length === 1 ? OPEN_ROLES[0] : null);
    return r ? `${r.role} (${r.ref})` : '';
  }, [params, OPEN_ROLES]);

  const [v, setV] = useState({ ...EMPTY, position: initialPosition });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState('form'); // form | sending | done
  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState('');
  const [alertKind, setAlertKind] = useState('');
  const [showSsn, setShowSsn] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy summary');

  const set = (name, value) => setV((p) => ({ ...p, [name]: value }));
  const touch = (name) => setTouched((t) => ({ ...t, [name]: true }));
  const err = (name) => (touched[name] || submitted ? check(name, v[name]) : '');
  const bind = (name) => ({ id: name, value: v[name], onChange: (e) => set(name, e.target.value), onBlur: () => touch(name) });
  const done = (sec) => sec.required.every((n) => !check(n, v[n])) && !check('idBack', v.idBack);
  const stillInvalid = [...REQUIRED, 'idBack'].some((n) => check(n, v[n]));
  const goto = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  const toggleCert = (c) => setV((p) => {
    const has = p.certs.includes(c);
    if (c === 'None') return { ...p, certs: has ? [] : ['None'], otherCerts: has ? p.otherCerts : '' };
    const rest = p.certs.filter((x) => x !== 'None');
    return { ...p, certs: has ? rest.filter((x) => x !== c) : [...rest, c] };
  });
  const noCerts = v.certs.includes('None');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const bad = [...REQUIRED, 'idBack'].find((n) => check(n, v[n]));
    if (bad) {
      setAlert('Some required details are missing or need fixing. The first one is highlighted below.');
      setAlertKind('fields');
      const el = document.getElementById(bad);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus({ preventScroll: true }); }
      return;
    }
    setAlert('');
    setPhase('sending');
    const { ssn, idFront, idBack, ...rest } = v;
    const record = { ...rest, truth: true, consent: true };
    try {
      const r = await submitApplication(record, { ssn: ssn.replace(/\D/g, ''), idFront, idBack });
      setResult({ record: { ref: r.ref, submittedAt: r.submittedAt, ...rest } });
      setV((p) => ({ ...p, ssn: '', idFront: null, idBack: null }));
      setPhase('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (x) {
      setAlert(x.message);
      setAlertKind('server');
      setPhase('form');
    }
  };

  if (OPEN_ROLES.length === 0) {
    return (
      <>
        <Hero photo="glow" scene="rise" rigX={0.62} eyebrow="Application form" title="No positions are open right now." lede="Every role is currently closed. New positions are posted as crews rotate." />
        <section className="section"><div className="wrap"><Link className="btn primary" to="/jobs">See all positions</Link></div></section>
      </>
    );
  }

  if (phase === 'done' && result) {
    const text = summaryText(result.record);
    const copy = async () => {
      try { await navigator.clipboard.writeText(text); setCopyLabel('Copied'); } catch { setCopyLabel('Select the text and copy'); }
      setTimeout(() => setCopyLabel('Copy summary'), 1800);
    };
    return (
      <>
        <Hero photo="glow" scene="rise" rigX={0.62} eyebrow="Application form" title="Application received." lede="Thank you for applying to GDoilco." />
        <section className="section">
          <div className="wrap">
            <div className="done-panel show" aria-live="polite">
              <div className="eyebrow">Reference number</div>
              <div className="refno">{result.record.ref}</div>
              <p className="status-line">Your application, Social Security number and ID were sent over an encrypted connection. Keep this reference and quote it when you contact {CONTACT.email}.</p>
              <h3>Your copy</h3>
              <pre tabIndex={0}>{text}</pre>
              <div className="btn-row" style={{ margin: 0 }}>
                <button className="btn primary" type="button" onClick={copy}>{copyLabel}</button>
                <button className="btn line" type="button" onClick={() => downloadText(`GDoilco-application-${result.record.ref}.txt`, text)}>Save as file</button>
                <Link className="btn line" to="/jobs">Back to positions</Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Hero photo="glow" scene="rise" rigX={0.62} eyebrow="Application form" title="Apply for a rotation." lede={`Five short sections. It takes about ten minutes, and you can see your progress on the left. ${OPEN_ROLES.length === 1 ? `Only the ${OPEN_ROLES[0].role} position is open right now.` : `${OPEN_ROLES.length} positions are open right now.`} Only one application per person is accepted.`} />
      <section className="section">
        <div className="wrap form-layout">
          <aside>
            <ol className="progress" aria-label="Application sections">
              {SECTIONS.map((s) => (
                <li key={s.id}><a href={'#' + s.id} className={done(s) ? 'done' : ''} onClick={goto(s.id)}>{s.title}</a></li>
              ))}
            </ol>
          </aside>

          <form className="app" onSubmit={onSubmit} noValidate autoComplete="off">
            <fieldset className="sec" id="sec1">
              <legend>About you</legend>
              <p className="hint">We use these details to contact you about your application.</p>
              <div className="row">
                <Field id="fullName" label="Full name" required error={err('fullName')}><input type="text" autoComplete="name" {...bind('fullName')} /></Field>
                <Field id="email" label="Email address" required error={err('email')}><input type="email" autoComplete="email" inputMode="email" {...bind('email')} /></Field>
              </div>
              <div className="row">
                <Field id="phone" label="Mobile phone number" required error={err('phone')}><input type="tel" autoComplete="tel" inputMode="tel" placeholder="(555) 555-0100" {...bind('phone')} /></Field>
                <Field id="residence" label="City and state where you live" required error={err('residence')}><input type="text" autoComplete="address-level2" placeholder="e.g. Houston, TX" {...bind('residence')} /></Field>
              </div>
              <div className="row">
                <Field label="Are you legally authorized to work in the United States?" required error={err('authorized')}>
                  <div className="opts" id="authorized" tabIndex={-1}>
                    {['Yes', 'No'].map((o) => (
                      <label className="opt" key={o}><input type="radio" name="authorized" value={o} checked={v.authorized === o} onChange={() => { set('authorized', o); touch('authorized'); }} /> {o}</label>
                    ))}
                  </div>
                </Field>
                <Field label="Will you now or in the future need visa sponsorship?" required error={err('sponsorship')}>
                  <div className="opts" id="sponsorship" tabIndex={-1}>
                    {['Yes', 'No'].map((o) => (
                      <label className="opt" key={o}><input type="radio" name="sponsorship" value={o} checked={v.sponsorship === o} onChange={() => { set('sponsorship', o); touch('sponsorship'); }} /> {o}</label>
                    ))}
                  </div>
                </Field>
              </div>
            </fieldset>

            <fieldset className="sec" id="sec2">
              <legend>The job</legend>
              <p className="hint">Only open positions are listed. All other roles are currently closed. We accept one application per person.</p>
              <Field id="position" label="Position" required error={err('position')}>
                <select {...bind('position')}>
                  <option value="">Select a position</option>
                  {OPEN_ROLES.map((r) => (
                    <option key={r.ref} value={`${r.role} (${r.ref})`}>{r.role} - {r.base}, {r.rot}</option>
                  ))}
                </select>
              </Field>
              <Field label="Where do you want to work?" required error={err('mode')}>
                <div className="opts" id="mode" tabIndex={-1}>
                  {['Offshore', 'Onshore', 'Either'].map((m) => (
                    <label className="opt" key={m}><input type="radio" name="mode" value={m} checked={v.mode === m} onChange={() => { set('mode', m); touch('mode'); }} /> {m}</label>
                  ))}
                </div>
              </Field>
              <div className="row">
                <Field id="rotation" label="Preferred schedule">
                  <select {...bind('rotation')}><option>No preference</option><option>Full-time office</option><option>7/7</option><option>14/14</option><option>21/21</option><option>28/28</option></select>
                </Field>
                <Field id="startDate" label="Available from" hint="Leave blank if you can start now."><input type="date" {...bind('startDate')} /></Field>
              </div>
            </fieldset>

            <fieldset className="sec" id="sec3">
              <legend>Experience</legend>
              <p className="hint">Tell us what you have done and what you hold.</p>
              <div className="row">
                <Field id="years" label="Years of work experience" required error={err('years')}>
                  <select {...bind('years')}><option value="">Select</option><option>None yet</option><option>Under 2 years</option><option>2 to 5 years</option><option>6 to 10 years</option><option>11 to 15 years</option><option>More than 15 years</option></select>
                </Field>
                <Field id="qual" label="Highest qualification" required error={err('qual')}>
                  <select {...bind('qual')}><option value="">Select</option><option>High school diploma or GED</option><option>Trade certificate or apprenticeship</option><option>Associate degree</option><option>Bachelor's degree</option><option>Master's degree or higher</option></select>
                </Field>
              </div>
              <Field id="lastRole" label="Most recent job title and employer" required error={err('lastRole')}><input type="text" placeholder="e.g. Accounts payable clerk, Company name" {...bind('lastRole')} /></Field>
              <Field label="Certificates you hold" required error={err('certs')}>
                <div className="opts" id="certs" tabIndex={-1}>
                  {CERTS.map((c) => (
                    <label className="opt" key={c}><input type="checkbox" checked={v.certs.includes(c)} onChange={() => { toggleCert(c); touch('certs'); }} /> {c}</label>
                  ))}
                  <label className="opt none"><input type="checkbox" checked={noCerts} onChange={() => { toggleCert('None'); touch('certs'); }} /> None</label>
                </div>
              </Field>
              <Field id="otherCerts" label="Other certificates" hint={noCerts ? 'Not needed because you chose None.' : 'Separate with commas.'}><input type="text" disabled={noCerts} {...bind('otherCerts')} /></Field>
              <Field id="summary" label="Short summary of your experience">
                <textarea maxLength={600} {...bind('summary')} />
                <small>{v.summary.length} / 600</small>
              </Field>
            </fieldset>

            <fieldset className="sec" id="sec4">
              <legend>Identity</legend>
              <p className="secure-note">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                We use your Social Security number and ID only to verify who you are, confirm your right to work and run the background check. They travel over an encrypted connection and are stored encrypted.
              </p>
              <div className="row">
                <Field id="ssn" label="Social Security number" required error={err('ssn')}>
                  <div className="ssn-wrap">
                    <input
                      type={showSsn ? 'text' : 'password'} inputMode="numeric" autoComplete="off" spellCheck={false}
                      placeholder="123-45-6789" maxLength={11}
                      value={v.ssn} onChange={(e) => set('ssn', formatSsn(e.target.value))} onBlur={() => touch('ssn')} id="ssn"
                    />
                    <button type="button" className="copy" aria-pressed={showSsn} onClick={() => setShowSsn(!showSsn)}>{showSsn ? 'Hide' : 'Show'}</button>
                  </div>
                </Field>
                <Field id="idType" label="Type of ID" required error={err('idType')}>
                  <select {...bind('idType')}><option value="">Select</option>{ID_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                </Field>
              </div>
              <Field id="idFront" label="Photo or scan of your ID (front)" required error={err('idFront')} hint="Make sure all four corners and the text are visible.">
                <FileDrop id="idFront" file={v.idFront} onFile={(f) => { set('idFront', f); touch('idFront'); }} />
              </Field>
              <Field id="idBack" label="Back of your ID (if it has one)" error={err('idBack')}>
                <FileDrop id="idBack" file={v.idBack} onFile={(f) => { set('idBack', f); touch('idBack'); }} />
              </Field>
            </fieldset>

            <fieldset className="sec" id="sec5">
              <legend>Reference and consent</legend>
              <p className="hint">One person who has worked with you and can speak to your skills.</p>
              <div className="row">
                <Field id="refName" label="Reference name" required error={err('refName')}><input type="text" {...bind('refName')} /></Field>
                <Field id="refPhone" label="Reference phone number" required error={err('refPhone')}><input type="tel" inputMode="tel" {...bind('refPhone')} /></Field>
              </div>
              <Field id="refRole" label="How do they know your work?"><input type="text" placeholder="e.g. Former supervisor" {...bind('refRole')} /></Field>
              <div className={'field' + (err('truth') ? ' bad' : '')}>
                <label className="consent"><input type="checkbox" id="truth" checked={v.truth} onChange={(e) => { set('truth', e.target.checked); touch('truth'); }} /><span>I confirm the information I have given is true, and I understand GDoilco may verify my certificates and references.</span></label>
                <div className="err" role="alert">{err('truth')}</div>
              </div>
              <div className={'field' + (err('consent') ? ' bad' : '')}>
                <label className="consent"><input type="checkbox" id="consent" checked={v.consent} onChange={(e) => { set('consent', e.target.checked); touch('consent'); }} /><span>I agree that GDoilco may store my details, Social Security number and ID to verify my identity and right to work, and may contact me about this role. I understand a background check and drug screen may be required before employment.</span></label>
                <div className="err" role="alert">{err('consent')}</div>
              </div>
            </fieldset>

            <div className={'alert' + (alert && (alertKind === 'server' || stillInvalid) ? ' show' : '')} role="alert">{alert}</div>
            <div className="form-actions">
              <button className="btn primary" type="submit" disabled={phase === 'sending'}>{phase === 'sending' ? 'Sending securely...' : 'Submit application'}</button>
              <span className="note">Fields marked with an asterisk are required. GDoilco is an equal opportunity employer. Employment depends on work authorization, a background check and a drug screen.</span>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
