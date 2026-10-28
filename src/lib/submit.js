// Sends the application to the GDoilco server (server/index.js).
// Nothing sensitive is kept in the browser: the SSN and ID files live only in form state until they are sent.
const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function assertSecure(url) {
  const u = new URL(url, window.location.href);
  const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
  if (u.protocol !== 'https:' && !local) {
    throw new Error('Identity documents can only be sent over a secure (https) connection.');
  }
}

// record: everything except the SSN and ID files. sensitive: { ssn, idFront, idBack }.
export async function submitApplication(record, sensitive) {
  const url = API + '/api/applications';
  assertSecure(url);

  const body = new FormData();
  body.append('application', JSON.stringify(record));
  body.append('ssn', sensitive.ssn);
  body.append('idFront', sensitive.idFront);
  if (sensitive.idBack) body.append('idBack', sensitive.idBack);

  let res;
  try {
    res = await fetch(url, { method: 'POST', body, credentials: 'omit' });
  } catch {
    throw new Error('We could not reach the application server. Check your connection and try again.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) throw new Error(data.error || `The server did not accept the application (${res.status}).`);
  return { ref: data.ref, submittedAt: data.submittedAt };
}

// A copy for the applicant to keep. It never contains the SSN or the ID files.
export function summaryText(r) {
  return [
    `GDOILCO APPLICATION ${r.ref}`, `Submitted ${r.submittedAt}`, '',
    'ABOUT THE APPLICANT', `Name: ${r.fullName}`, `Email: ${r.email}`, `Phone: ${r.phone}`, `Lives in: ${r.residence}`, `Authorized to work in the U.S.: ${r.authorized}`, `Needs visa sponsorship: ${r.sponsorship}`, '',
    'THE JOB', `Position: ${r.position}`, `Work type: ${r.mode}`, `Rotation: ${r.rotation}`, `Available from: ${r.startDate || 'Not stated'}`, '',
    'EXPERIENCE', `Years in the industry: ${r.years}`, `Most recent role: ${r.lastRole}`, `Highest qualification: ${r.qual}`,
    `Certificates: ${r.certs.join(', ')}${r.otherCerts ? '; ' + r.otherCerts : ''}`, `Summary: ${r.summary || 'Not provided'}`, '',
    'IDENTITY', `ID type: ${r.idType}`, 'Social Security number and ID files: received (not shown here)', '',
    'REFERENCE', `Name: ${r.refName}`, `Phone: ${r.refPhone}`, `Relationship: ${r.refRole || 'Not stated'}`,
  ].join('\n');
}

export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
