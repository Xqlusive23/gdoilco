// The two emails applicants receive. Tables and inline styles, because that is what email programs understand.
// Images are attached to the message and referenced as cid:name, so they show even when the website is offline.
import { CONTACT } from '../../src/data.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const first = (name) => esc(String(name || '').trim().split(/\s+/)[0] || 'there');
const when = (iso) => {
  try { return new Date(iso).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Chicago' }) + ' CT'; } catch { return String(iso); }
};

export const ASSETS = {
  'banner-confirm': 'banner-confirm.jpg',
  'banner-approved': 'banner-approved.jpg',
  'logo-white': 'logo-white.png',
  'check-copper': 'check-copper.png',
  'check-green': 'check-green.png',
  'step-docs': 'step-docs.png',
  'step-call': 'step-call.png',
  'step-clear': 'step-clear.png',
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";

function step(icon, title, text) {
  return `<tr>
    <td width="64" valign="top" style="padding:0 0 18px 0;"><img src="cid:${icon}" width="48" height="48" alt="" style="display:block;border:0;border-radius:24px;"></td>
    <td valign="top" style="padding:2px 0 18px 0;font-family:${SANS};font-size:15px;line-height:22px;color:#566272;"><strong style="color:#14202E;font-size:16px;">${title}</strong><br>${text}</td>
  </tr>`;
}

function shell({ preheader, banner, badge, badgeColor, heading, intro, ref, refLabel, rows, stepsTitle, steps, closing, siteUrl, button }) {
  const detail = rows.map(([k, v]) => `<tr>
      <td style="padding:9px 0;border-bottom:1px solid #E5DFD3;font-family:${SANS};font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#7A8594;" width="38%">${esc(k)}</td>
      <td style="padding:9px 0;border-bottom:1px solid #E5DFD3;font-family:${SANS};font-size:15px;color:#14202E;">${esc(v)}</td></tr>`).join('');
  const btn = button && siteUrl ? `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:6px auto 0;"><tr><td bgcolor="#A6522B" style="border-radius:3px;"><a href="${esc(siteUrl + button.path)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;">${esc(button.label)}</a></td></tr></table>` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>GDoilco</title></head>
<body style="margin:0;padding:0;background:#EDE8DE;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#EDE8DE;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#EDE8DE"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:6px;overflow:hidden;">
    <tr><td bgcolor="#14202E" style="padding:16px 28px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle"><img src="cid:logo-white" width="36" height="36" alt="" style="display:block;border:0;"></td>
        <td valign="middle" style="padding-left:12px;font-family:${SERIF};font-size:24px;font-weight:bold;color:#FFFFFF;">GDoilco<br><span style="font-family:${SANS};font-size:10px;font-weight:600;letter-spacing:3px;color:#C9A45C;">ENERGY WORKFORCE</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="line-height:0;font-size:0;"><img src="cid:${banner}" width="600" alt="An offshore rig at sunset" style="display:block;width:100%;height:auto;border:0;"></td></tr>
    <tr><td style="padding:34px 36px 8px 36px;" align="center">
      <img src="cid:${badge}" width="56" height="56" alt="" style="display:block;margin:0 auto 14px;border:0;">
      <h1 style="margin:0 0 12px;font-family:${SERIF};font-size:30px;line-height:36px;font-weight:normal;color:#14202E;">${heading}</h1>
      <p style="margin:0;font-family:${SANS};font-size:16px;line-height:25px;color:#566272;">${intro}</p>
    </td></tr>
    <tr><td style="padding:22px 36px 6px 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;border:2px dashed ${badgeColor};border-radius:4px;"><tr><td align="center" style="padding:20px 12px;">
        <div style="font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:3px;color:#7A8594;">${refLabel}</div>
        <div style="margin-top:8px;font-family:${MONO};font-size:26px;line-height:32px;font-weight:bold;letter-spacing:2px;color:${badgeColor};">${esc(ref)}</div>
        <div style="margin-top:8px;font-family:${SANS};font-size:13px;color:#7A8594;">Keep this number and quote it whenever you contact us.</div>
      </td></tr></table>
    </td></tr>
    <tr><td style="padding:14px 36px 6px 36px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detail}</table></td></tr>
    <tr><td style="padding:26px 36px 0 36px;">
      <h2 style="margin:0 0 16px;font-family:${SERIF};font-size:22px;font-weight:normal;color:#14202E;">${stepsTitle}</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${steps.map((s) => step(...s)).join('')}</table>
    </td></tr>
    <tr><td style="padding:4px 36px 30px 36px;">
      ${btn}
      <p style="margin:22px 0 0;font-family:${SANS};font-size:14px;line-height:22px;color:#566272;text-align:center;">${closing}</p>
    </td></tr>
    <tr><td bgcolor="#14202E" align="center" style="padding:20px 28px;font-family:${SANS};font-size:12px;line-height:19px;color:#94A3B6;">
      Questions? Write to <a href="mailto:${CONTACT.email}" style="color:#E9CB8C;">${CONTACT.email}</a> or call ${esc(CONTACT.phone)}.<br>
      You are receiving this email because an application was submitted with this address.<br>&copy; ${new Date().getFullYear()} GDoilco. Equal opportunity employer.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

// type: 'confirmation' | 'approval'. d: { fullName, ref, position, submittedAt, approvedAt, email, siteUrl }
export function renderEmail(type, d) {
  const name = first(d.fullName);
  if (type === 'confirmation') {
    const subject = `We received your application: ${d.ref}`;
    const html = shell({
      preheader: `Your application number is ${d.ref}. Keep it for your records.`,
      banner: 'banner-confirm', badge: 'check-copper', badgeColor: '#A6522B',
      heading: `Thank you, ${name}. Your application is in.`,
      intro: 'We have received your application and saved it securely. Your Social Security number and ID were sent over an encrypted connection and are never shown in emails.',
      ref: d.ref, refLabel: 'YOUR APPLICATION NUMBER',
      rows: [['Position', d.position], ['Submitted', when(d.submittedAt)], ['Sent to', d.email]],
      stepsTitle: 'What happens next',
      steps: [
        ['step-docs', 'We review your application', 'A recruiter checks your experience, certificates and documents.'],
        ['step-call', 'You hear from us', 'If your profile fits the role, a recruiter contacts you to talk through the next step.'],
        ['step-clear', 'Checks and clearance', 'Verification of your ID and credentials, and where the job needs it, a physical and drug screen.'],
      ],
      closing: 'We accept one application per person, so there is no need to apply again. We will email you when there is news about this application.',
      siteUrl: d.siteUrl, button: { label: 'See current openings', path: '/jobs' },
    });
    const text = [
      `Thank you, ${String(d.fullName).split(' ')[0]}. Your GDoilco application is in.`, '',
      `YOUR APPLICATION NUMBER: ${d.ref}`, 'Keep this number and quote it whenever you contact us.', '',
      `Position: ${d.position}`, `Submitted: ${when(d.submittedAt)}`, '',
      'What happens next:', '1. We review your application.', '2. If your profile fits the role, a recruiter contacts you.',
      '3. Checks and clearance: ID and credential checks, and where needed a physical and drug screen.', '',
      'We accept one application per person, so there is no need to apply again.', `Questions? ${CONTACT.email} or ${CONTACT.phone}`,
    ].join('\n');
    return { subject, html, text };
  }

  const subject = `Your application is approved: ${d.ref}`;
  const html = shell({
    preheader: `Good news, ${String(d.fullName).split(' ')[0]}. Your application ${d.ref} has been approved.`,
    banner: 'banner-approved', badge: 'check-green', badgeColor: '#1E7B45',
    heading: `Good news, ${name}. Your application is approved.`,
    intro: 'Your application has passed our review. This is the next step toward joining a crew. Your start date is confirmed in your joining instructions, which we send once your checks are complete.',
    ref: d.ref, refLabel: 'APPLICATION NUMBER',
    rows: [['Position', d.position], ['Approved', when(d.approvedAt)], ['Sent to', d.email]],
    stepsTitle: 'Your next steps',
    steps: [
      ['step-call', 'Expect a call from a recruiter', 'We will reach you to confirm your availability and rotation.'],
      ['step-docs', 'Have your documents ready', 'Keep your ID, certificates (such as TWIC and your safety orientation) and reference contact to hand.'],
      ['step-clear', 'Screening and mobilization', 'Where the role needs it we book your physical and drug screen, then send your joining instructions.'],
    ],
    closing: 'Please do not share your application number with anyone except GDoilco staff. If you did not apply to GDoilco, tell us at once.',
    siteUrl: d.siteUrl, button: { label: 'Visit GDoilco', path: '/' },
  });
  const text = [
    `Good news, ${String(d.fullName).split(' ')[0]}. Your GDoilco application is approved.`, '',
    `APPLICATION NUMBER: ${d.ref}`, '', `Position: ${d.position}`, `Approved: ${when(d.approvedAt)}`, '',
    'Your application has passed our review. Your start date is confirmed in your joining instructions, sent once your checks are complete.', '',
    'Next steps:', '1. Expect a call from a recruiter to confirm your availability and rotation.',
    '2. Have your ID, certificates and reference contact ready.', '3. Screening and mobilization: where needed we book your physical and drug screen, then send joining instructions.', '',
    `Questions? ${CONTACT.email} or ${CONTACT.phone}`,
  ].join('\n');
  return { subject, html, text };
}
