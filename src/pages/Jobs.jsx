import { Link, useSearchParams } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import Board from '../components/Board.jsx';
import Marquee from '../components/Marquee.jsx';
import { DISCIPLINES, isOpen, placeOf } from '../data.js';
import { usePositions } from '../lib/positions.js';

export default function Jobs() {
  const { roles: ROLES } = usePositions();
  const [params, setParams] = useSearchParams();
  const current = DISCIPLINES[params.get('d')] ? params.get('d') : 'all';
  const shown = current === 'all' ? ROLES : ROLES.filter((r) => r.d === current);
  const openCount = shown.filter(isOpen).length;
  const openAll = ROLES.filter(isOpen);
  const ticker = [
    ...ROLES.filter(isOpen).map((r) => `Open now: ${r.role}, ${placeOf(r)}`),
    'Apply online in about ten minutes', 'Other positions reopen as crews rotate', 'Equal opportunity employer',
  ];
  const choose = (key) => (key === 'all' ? setParams({}) : setParams({ d: key }));

  return (
    <>
      <Hero
        photo="dusk" scene="day" rigX={0.8}
        eyebrow="Positions"
        title="Find your place on the rig."
        lede="Filter by discipline and check the rotation and certificates. Open roles can be applied for now. Closed roles reopen as crews rotate."
      />
      <Marquee items={ticker} tone="dark" seconds={38} label="Current openings" />

      <section className="section">
        <div className="wrap">
          <div className="filters" role="group" aria-label="Filter by discipline">
            <button className="chip" type="button" aria-pressed={current === 'all'} onClick={() => choose('all')}>All roles</button>
            {Object.entries(DISCIPLINES).map(([key, name]) => (
              <button key={key} className="chip" type="button" aria-pressed={current === key} onClick={() => choose(key)}>{name}</button>
            ))}
          </div>
          <div className="count" aria-live="polite">{shown.length} {shown.length === 1 ? 'position' : 'positions'} shown, {openCount} open</div>
          <Board roles={shown} note={<>Rotation shows days on / days off. Closed roles are listed so you can see what we recruit for. Check back soon.</>} />
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <h2>{openAll.length === 0 ? 'No roles are open right now.' : openAll.length === 1 ? `The ${openAll[0].role} role is open.` : `${openAll.length} roles are open right now.`}</h2>
          {openAll.length > 0 && <Link className="btn" to="/apply">Apply now</Link>}
        </div>
      </section>
    </>
  );
}
