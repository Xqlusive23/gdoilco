import { useState } from 'react';
import { Link } from 'react-router-dom';
import PhotoBand from '../components/PhotoBand.jsx';
import Hero from '../components/Hero.jsx';
import { CONTACT } from '../data.js';

function CopyCard({ title, value, label, note }) {
  const [state, setState] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setState('Copied'); } catch { setState('Select and copy'); }
    setTimeout(() => setState(''), 1800);
  };
  return (
    <div className="contact-card">
      <h3>{title}</h3>
      <div className="val">{value}</div>
      <button className="copy" type="button" onClick={copy}>{state || label}</button>
      <p>{note}</p>
    </div>
  );
}

const FAQ = [
  ['Why do you ask for my Social Security number and ID?', 'We use them to verify your identity and right to work and to run the background check the role requires. They are sent over an encrypted connection and stored encrypted. Never send them by email or text.'],
  ['Do I need offshore experience to apply?', 'For some roles, yes. Others, such as roughneck, camp and trainee positions, accept people with onshore or no rig experience if they can complete the safety training.'],
  ['What does 14/14 mean?', 'You work 14 days on the rig, then have 14 days off. 7/7, 21/21 and 28/28 work the same way.'],
  ['Do I need to be authorized to work in the United States?', 'Yes. We verify work authorization with Form I-9 after an offer. Most offshore roles also need a TWIC card, which has its own eligibility rules.'],
  ['Is a background check required?', 'Most operators require a background check and a pre-employment drug screen before you mobilize. We explain what applies to your role during the screening call.'],
  ['Which certificates do I need before I apply?', <>You can apply without them. We will tell you which ones the role needs and point you to approved training providers. See the <Link to="/safety">safety page</Link> for the usual list.</>],
  ['How will I hear back?', 'A recruiter contacts shortlisted candidates by phone or email. Quote your reference number when you write to us.'],
  ['Beware of fake recruiters', 'Only trust messages from the addresses on this page. If someone asks you for money to secure a rig job, do not pay, and tell us.'],
];

export default function Contact() {
  return (
    <>
      <Hero photo="aerialSun" scene="fog" rigX={0.8} eyebrow="Contact" title="Talk to the recruitment desk." lede="Questions about a role, a certificate or the application form? Reach the team directly." />

      <section className="section">
        <div className="wrap">
          <div className="contact-grid">
            <CopyCard title="Recruitment desk" value={CONTACT.email} label="Copy email" note="For candidates. Include your application reference if you have one." />
            <CopyCard title="Call us" value={CONTACT.phone} label="Copy number" note="Monday to Friday, 8:00 AM to 5:00 PM Central Time." />
            <div className="contact-card"><h3>Houston, TX</h3><p>Main base for drilling, offshore and administrative crews. Visits by appointment.</p></div>
            <div className="contact-card"><h3>Lafayette, LA</h3><p>Base for Gulf platform, marine and medical roles. Visits by appointment.</p></div>
            <div className="contact-card"><h3>Midland, TX</h3><p>Base for Permian Basin land rig crews. Visits by appointment.</p></div>
          </div>
        </div>
      </section>

      <PhotoBand photo="platform2">Tell us what you are looking for. A recruiter will write back.</PhotoBand>

      <section className="section alt">
        <div className="wrap split">
          <div><div className="eyebrow">Good to know</div><h2 style={{ marginTop: 14 }}>Frequently asked</h2></div>
          <div>
            {FAQ.map(([q, a]) => (
              <details className="faq" key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
