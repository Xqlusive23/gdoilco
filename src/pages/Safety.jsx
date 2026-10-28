import { useState } from 'react';
import { Link } from 'react-router-dom';
import PhotoBand from '../components/PhotoBand.jsx';
import Hero from '../components/Hero.jsx';
import Marquee from '../components/Marquee.jsx';

const RULES = [
  ['Stop work authority', 'Anyone can stop the job', 'If something looks unsafe, any person on the rig can halt the work. No one is penalized for stopping a job.'],
  ['Permit to work', 'No permit, no work', 'Hot work, confined space entry and lifting over live equipment all need a signed permit that names the hazards.'],
  ['Muster', 'Know your station', 'Every person learns the alarm signals and their muster point on day one, then practices them in drills.'],
  ['Dropped objects', 'Nothing falls from height', 'Tools are tethered, loads are checked and the zone under a lift is kept clear.'],
  ['H2S', 'Know the gas, know the exit', 'Hydrogen sulfide can be fatal. Crews wear detectors and know the wind direction and escape routes.'],
];

const CERTS = [
  ['TWIC card', 'Federal credential for unescorted access to ports, vessels and offshore facilities.', '5 years', 'Most offshore and marine roles'],
  ['Offshore survival (HUET)', 'Sea survival and helicopter underwater escape training.', 'Typically 4 years', 'Nearly all offshore roles'],
  ['SafeGulf or SEMS orientation', 'Safety and environmental management systems awareness for Gulf of Mexico work.', 'Set by operator', 'Gulf platform and rig roles'],
  ['Offshore physical and drug screen', 'Fitness to work offshore and a pre-employment drug test.', 'Set by operator', 'All offshore roles'],
  ['IADC WellSharp', 'Controlling a well during drilling and well-service operations.', '2 years', 'Drillers, toolpushers, supervisors'],
  ['H2S awareness', 'Recognizing hydrogen sulfide and escaping it.', 'Set by provider', 'Drilling and production roles'],
  ['Crane and rigging', 'Lifting operations, signaling and slinging.', 'Set by provider', 'Crane operators, riggers'],
];

const CHECKLIST = [
  ['Proof of work eligibility', 'Documents for Form I-9, such as a U.S. passport, or a driver license with a Social Security card.'],
  ['TWIC card', 'Required for most offshore and port roles. You can apply through TSA if you do not have one yet.'],
  ['Offshore survival (HUET) certificate', 'In date, from an approved training provider.'],
  ['Ready for a physical and drug screen', 'We arrange these with an approved clinic once you are shortlisted.'],
  ['Trade or role certifications', 'Well control, crane, welding, electrical or marine credentials that match your role.'],
  ['Two work references', 'Former supervisors who can confirm your rig experience.'],
  ['Up-to-date resume', 'Dates, employers, rig types and rotations for each offshore job.'],
];

export default function Safety() {
  const [ticked, setTicked] = useState(() => CHECKLIST.map(() => false));
  const n = ticked.filter(Boolean).length;
  const pct = Math.round((n / CHECKLIST.length) * 100);

  return (
    <>
      <Hero
        photo="crew" scene="night" rigX={0.78}
        eyebrow="Safety and training"
        title="Safe on the rig starts on the beach."
        lede={'On a rig, "the beach" means onshore. Everything that keeps a crew safe offshore is checked there first.'}
      />
      <Marquee items={['Stop work authority', 'No permit, no work', 'Know your muster station', 'Nothing falls from height', 'Know the gas, know the exit']} tone="accent" seconds={36} label="Safety reminders" />

      <section className="section">
        <div className="wrap">
          <div className="section-head"><div className="eyebrow">Rules every crew member learns</div><h2>Five habits that protect the crew</h2></div>
          <div className="rules">
            {RULES.map(([tag, title, text]) => (
              <div className="rule" key={tag}><span className="tag">{tag}</span><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <PhotoBand photo="dusk">Nobody is ever too busy to stop a job that is not safe.</PhotoBand>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Certificates we check</div>
            <h2>What operators ask for</h2>
            <p className="lede">Requirements vary by operator and role. Always check the exact expiry date and approved provider printed on your certificate.</p>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Certificate</th><th>What it covers</th><th>Typical validity</th><th>Needed for</th></tr></thead>
              <tbody>
                {CERTS.map(([a, b, c, d]) => (
                  <tr key={a}><td>{a}</td><td className="m">{b}</td><td>{c}</td><td className="m">{d}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section" id="readiness">
        <div className="wrap split">
          <div>
            <div className="eyebrow">Readiness checklist</div>
            <h2 style={{ marginTop: 14 }}>Are you ready to go offshore?</h2>
            <p className="lede" style={{ marginTop: 18 }}>Tick what you already hold. Nothing is saved or sent, so use it as a quick check before you apply.</p>
            <div className="btn-row"><Link className="btn primary" to="/apply">Apply now</Link></div>
          </div>
          <div className="check">
            {CHECKLIST.map(([title, hint], i) => (
              <label key={title}>
                <input type="checkbox" checked={ticked[i]} onChange={() => setTicked(ticked.map((v, j) => (j === i ? !v : v)))} />
                <span><b>{title}</b><small>{hint}</small></span>
              </label>
            ))}
            <div className="meter">
              <div className="bar"><i style={{ width: pct + '%' }} /></div>
              <p aria-live="polite">
                {n === CHECKLIST.length
                  ? 'You have the core paperwork for offshore work. Apply now.'
                  : `${n} of ${CHECKLIST.length} ticked. Anything missing is a training course away, and our team can point you to approved providers.`}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
