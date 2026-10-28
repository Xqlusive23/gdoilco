import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import Board from '../components/Board.jsx';
import Marquee from '../components/Marquee.jsx';
import Showreel from '../components/Showreel.jsx';
import Photo from '../components/Photo.jsx';
import VideoBg from '../components/VideoBg.jsx';
import { PHOTOS, VIDEOS } from '../media.js';
import { DisciplineIcon } from '../components/Icons.jsx';
import { JackUp, SemiSub, Drillship, LandRig } from '../components/RigSvgs.jsx';
import { isOpen } from '../data.js';
import { usePositions } from '../lib/positions.js';

const DISCIPLINE_TILES = [
  ['drilling', 'Drilling', 'Driller, derrickhand, roughneck, toolpusher, mud engineer', 'Crews that turn pipe on the rig floor, on land and offshore.'],
  ['offshore', 'Offshore operations', 'Crane operator, helideck officer, rigger, deck foreman', 'People who move people and steel safely around the deck.'],
  ['marine', 'Marine and subsea', 'Marine engineer, ROV pilot, DP operator, able seaman', 'Vessel and underwater specialists for support and subsea work.'],
  ['maintenance', 'Maintenance', 'Rig electrician, mechanical fitter, instrument technician, welder', 'Trades that keep power, pumps and drilling equipment running.'],
  ['hse', 'HSE and medical', 'HSE advisor, offshore medic, safety officer', 'Health, safety and environment staff who protect the crew.'],
  ['support', 'Support and administration', 'Disbursement officer, camp boss, chef, storekeeper', 'The people who keep a crew paid, fed and housed a long way from shore.'],
];

const RIG_TYPES = [
  [JackUp, 'Jack-up', 'Legs lower to the seabed and lift the hull clear of the waves. The workhorse of shallow water.', 'Typical water depth: to about 400 ft'],
  [SemiSub, 'Semi-submersible', 'Floats on submerged pontoons and holds position with anchors or thrusters.', 'Typical water depth: to 10,000 ft and beyond'],
  [Drillship, 'Drillship', 'A ship hull with a derrick amidships, held on station by thrusters in deep water.', 'Typical water depth: to 10,000 ft and beyond'],
  [LandRig, 'Land rig', 'A mast and substructure with mud tanks and a camp, moved between well pads.', 'Onshore: Permian Basin and other U.S. shale plays'],
];

const AREAS = ['Drilling', 'Offshore operations', 'Marine and subsea', 'Maintenance', 'HSE and medical', 'Support and administration', 'U.S. Gulf Coast', 'Gulf of Mexico', 'Permian Basin'];

export default function Home() {
  const { roles, loading } = usePositions();
  const OPEN_NOW = roles.filter(isOpen);
  const PREVIEW = [...OPEN_NOW, ...roles.filter((r) => !isOpen(r)).slice(0, 3)];
  const TICKER = [...OPEN_NOW.map((r) => `Now hiring: ${r.role}, ${r.base}`), ...AREAS];
  return (
    <>
      <Hero
        photo="sunset" video="hero" scene="dusk" rigX={0.76} page={false}
        eyebrow="Oil and gas recruitment · United States"
        title={<>Skilled crews for <em>every rig.</em></>}
        lede="GDoilco recruits, vets and rotates drilling, offshore and marine personnel for operators working the Gulf Coast and the Permian Basin."
      >
        {OPEN_NOW[0] && (
          <Link className="hire-pill" to={'/apply?role=' + OPEN_NOW[0].ref}>
            <span className="pulse" aria-hidden="true" />
            Now hiring: {OPEN_NOW[0].role} · {OPEN_NOW[0].base}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
        <div className="btn-row">
          <Link className="btn primary" to="/jobs">See open roles</Link>
          <Link className="btn ghost" to="/apply">Apply now</Link>
        </div>
      </Hero>

      <Marquee items={TICKER} tone="accent" seconds={46} label="What GDoilco recruits for" />

      <section className="facts" aria-label="Rig life in numbers">
        <div className="facts-inner">
          <div className="fact"><b>14/14</b><span>A common Gulf Coast rotation: 14 days on the rig, 14 days at home.</span></div>
          <div className="fact"><b>TWIC</b><span>Transportation Worker Identification Credential. Most offshore and port roles require it.</span></div>
          <div className="fact"><b>3 bases</b><span>Crew change from Houston, Lafayette and Midland.</span></div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Life on the rig</div>
            <h2>Where the work happens</h2>
            <p className="lede">From the Gulf of Mexico to the Permian Basin, crews work around the clock. These are the places we recruit for.</p>
          </div>
          <div className="mosaic">
            {[
              ['platform', 'big', 'An offshore platform and its support vessels'],
              ['dusk', 'tall', 'A rig at the end of a day shift'],
              ['crew', '', 'On site as the light goes'],
              ['aerialSun', '', 'A rig seen from above at sunset'],
            ].map(([key, size, cap]) => (
              <figure className={'m ' + size} key={key}>
                <Photo srcs={PHOTOS[key].srcs} pos={PHOTOS[key].pos} live alt={cap} />
                <figcaption>{cap}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section reel-section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">How GDoilco works</div>
            <h2>From application to your first shift</h2>
            <p className="lede">A short tour of the hiring process. Pick a chapter or let it play.</p>
          </div>
          <Showreel />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Who we place</div>
            <h2>Six disciplines, one rig crew</h2>
            <p className="lede">A rig runs on many trades. We recruit across all of them, so an operator can fill a whole crew from one desk.</p>
          </div>
          <div className="grid">
            {DISCIPLINE_TILES.map(([key, name, roles, desc]) => (
              <Link className="tile" key={key} to={'/jobs?d=' + key}>
                <DisciplineIcon name={key} />
                <h3>{name}</h3>
                <p>{desc}</p>
                <div className="roles">{roles}</div>
                <span className="go">See roles &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Crew change board</div>
            <h2>Open positions</h2>
            <p className="lede">{loading ? 'Loading the current positions.' : OPEN_NOW.length === 0 ? 'No positions are open right now. New roles are posted as crews rotate.' : OPEN_NOW.length === 1 ? 'One position is open for applications right now. The other roles are closed and reopen as crews rotate.' : `${OPEN_NOW.length} positions are open for applications right now. The other roles are closed and reopen as crews rotate.`}</p>
          </div>
          <Board roles={PREVIEW} note={<>Rotation shows days on / days off. <Link style={{ color: '#FFB547' }} to="/jobs">View all positions</Link></>} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Where our people work</div>
            <h2>Four kinds of rig</h2>
            <p className="lede">Each rig type has its own crew structure, rotation and certificates. We match candidates to the unit they are suited to.</p>
          </div>
          <div className="rigs">
            {RIG_TYPES.map(([Svg, name, desc, depth]) => (
              <article className="rig" key={name}>
                <Svg />
                <h3>{name}</h3>
                <p>{desc}</p>
                <div className="depth">{depth}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap split">
          <div>
            <div className="eyebrow">How hiring works</div>
            <h2 style={{ marginTop: 14 }}>From form to first flight</h2>
            <p className="lede" style={{ marginTop: 18 }}>Four steps, and you know where you stand at each one. Most candidates hear from a recruiter within the working week.</p>
          </div>
          <ol className="steps">
            <li><div><h3>Apply online</h3><p>Fill in the application form. It takes about ten minutes. Keep your certificates and a reference contact to hand.</p></div></li>
            <li><div><h3>Screening call</h3><p>A recruiter calls to confirm your experience, preferred rotation and the date you can start.</p></div></li>
            <li><div><h3>Documents and screening</h3><p>We verify credentials such as your TWIC card and WellSharp certificate, and you complete an offshore physical and drug screen with an approved clinic.</p></div></li>
            <li><div><h3>Mobilization</h3><p>You receive your rotation schedule and joining instructions, then travel out on crew change day.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="film" aria-label="Rig life in motion">
        <Photo srcs={PHOTOS.dusk.srcs} pos={PHOTOS.dusk.pos} live className="film-photo" fallback={<div className="photo-fallback film-photo" />} />
        <VideoBg sources={VIDEOS.reel} />
        <div className="wrap film-inner">
          <div className="eyebrow">Rig life, in motion</div>
          <h2>Long rotations. Real crews. Steady work.</h2>
          <p className="lede">Most positions run on a fixed rotation, so you know when you are on the rig and when you are home.</p>
          <Link className="btn primary" to="/jobs">Browse positions</Link>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>Your next rotation starts with one form.</h2>
          <Link className="btn" to="/apply">Start your application</Link>
        </div>
      </section>
    </>
  );
}
