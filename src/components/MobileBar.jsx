import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isOpen } from '../data.js';
import { usePositions } from '../lib/positions.js';

// A slim "Apply" bar pinned to the bottom of phone screens once the visitor has scrolled a little.
export default function MobileBar() {
  const { pathname } = useLocation();
  const { roles } = usePositions();
  const [show, setShow] = useState(false);
  const open = roles.filter(isOpen);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 420);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [pathname]);

  if (pathname === '/apply' || open.length === 0) return null;
  const label = open.length === 1 ? `Apply: ${open[0].role}` : `${open.length} roles open`;
  return (
    <div className={'m-bar' + (show ? ' on' : '')} aria-hidden={!show}>
      <Link to={open.length === 1 ? '/apply?role=' + open[0].ref : '/jobs'} className="btn primary" tabIndex={show ? 0 : -1}>{label}<span aria-hidden="true">&rarr;</span></Link>
    </div>
  );
}
