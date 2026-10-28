import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DISCIPLINES, STATUS, isOpen } from '../data.js';

function useCentralClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => {
      try {
        setT(new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: 'America/Chicago' }).format(new Date()));
      } catch { setT(''); }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);
  return t;
}

// Airport-style crew change board.
export default function Board({ roles, note }) {
  const clock = useCentralClock();
  const sorted = [...roles].sort((a, b) => Number(!isOpen(a)) - Number(!isOpen(b))); // open roles first
  return (
    <div className="board">
      <div className="board-top"><span>Departures &middot; Crew change</span><span className="clock" aria-label="Local time">{clock || '--:-- CT'}</span></div>
      <div className="board-scroll">
        <table>
          <thead>
            <tr><th>Ref</th><th>Role</th><th>Unit and base</th><th>Rotation</th><th>Certificates</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.ref} className={isOpen(r) ? '' : 'is-closed'}>
                <td className="ref">{r.ref}</td>
                <td className="role">{r.role}<small>{DISCIPLINES[r.d]}</small></td>
                <td className="site">{r.site}<small>{r.base}</small></td>
                <td className="rot">{r.rot}</td>
                <td className="certs">{r.certs}</td>
                <td className="st"><span className={'pill ' + r.st}>{STATUS[r.st]}</span></td>
                <td className="act">{isOpen(r) ? <Link className="apply" to={'/apply?role=' + r.ref}>Apply</Link> : <span className="apply off">Closed</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <div className="board-note">{note}</div>}
    </div>
  );
}
