import { Link } from 'react-router-dom';
import PhotoBand from '../components/PhotoBand.jsx';
import Hero from '../components/Hero.jsx';
import Marquee from '../components/Marquee.jsx';
import { Anatomy } from '../components/RigSvgs.jsx';

const ZONES = [
  ['Derrick and drill floor', 'Drillers, derrickhands, roughnecks and the toolpusher run the drilling line.'],
  ['Helideck', 'Helideck officers and crew manage every crew change flight.'],
  ['Accommodation block', 'The medic, catering team, HSE advisor and the offshore installation manager.'],
  ['Crane and pipe deck', 'Crane operators, riggers and deck crew handle every lift.'],
  ['Hull and machinery', 'Electricians, mechanics and engineers keep power and pumps running.'],
  ['Legs and spud cans', 'The jacking crew sets the rig on the seabed and lifts the hull clear of the sea.'],
];

export default function About() {
  return (
    <>
      <Hero
        photo="platform" scene="dawn" rigX={0.3}
        eyebrow="About GDoilco"
        title="People who know the rig floor."
        lede="We started from a simple observation: operators need dependable crews, and good rig workers need a recruiter who understands the job."
      />
      <Marquee items={['Verified paperwork', 'Straight answers on pay and rotation', 'Hired from the communities we serve', 'Safety before schedule', 'Direct hire and contract crewing']} tone="dark" seconds={40} label="What we stand for" />

      <section className="section">
        <div className="wrap split">
          <div className="prose">
            <div className="eyebrow">What we do</div>
            <p>GDoilco is an oil and gas workforce company. We find, check and place people for drilling, offshore operations, marine support and the trades that keep a rig running.</p>
            <p>Our recruiters know the difference between a derrickhand and a driller, why a medical expires, and what a 28/28 rotation does to family life. That knowledge shapes how we match people and how we talk to them.</p>
            <p>We hire for assets across the Gulf Coast and the Permian Basin, and we help candidates who need training reach the certificates operators require.</p>
          </div>
          <ul className="list-plain">
            <li><b>Direct hire</b><span>Permanent placement for operators who want the person on their own payroll.</span></li>
            <li><b>Contract crewing</b><span>Rotating contract crews for a campaign, a shutdown or a drilling program.</span></li>
            <li><b>Certificate checking</b><span>We verify TWIC cards, physicals, well control and trade certifications before anyone mobilizes.</span></li>
          </ul>
        </div>
      </section>

      <PhotoBand photo="aerialSun">Operators need dependable crews. Rig workers need a recruiter who understands the job.</PhotoBand>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Anatomy of a jack-up rig</div>
            <h2>Where the work happens</h2>
            <p className="lede">A jack-up is a floating platform on three or four legs that stand on the seabed. Every zone below needs different people.</p>
          </div>
          <div className="split">
            <div className="diagram"><Anatomy /></div>
            <ol className="zone-list">
              {ZONES.map(([name, text], i) => (
                <li key={name}><span className="k">{i + 1}</span><div><b>{name}</b><span>{text}</span></div></li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head"><div className="eyebrow">How we work</div><h2>Three promises</h2></div>
          <div className="rules">
            <div className="rule"><span className="tag">Verified</span><h3>Paperwork before people</h3><p>Every certificate is checked against its issuer before a candidate goes forward. Operators never receive an unverified CV.</p></div>
            <div className="rule"><span className="tag">Clear</span><h3>Straight answers on pay and rotation</h3><p>Candidates see the rotation, base and certificate requirements for a role before they apply.</p></div>
            <div className="rule"><span className="tag">Regional</span><h3>Crews who live near the base</h3><p>We build shortlists from candidates who live close to the base, so crew change day means shorter travel and fewer missed flights.</p></div>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap"><h2>Ready to join a crew?</h2><Link className="btn" to="/apply">Apply now</Link></div>
      </section>
    </>
  );
}
