import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Logo } from './Icons.jsx';

const LINKS = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/jobs', 'Jobs'],
  ['/safety', 'Safety'],
  ['/contact', 'Contact'],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);

  // On phones the menu is a drawer: lock the page behind it and let Escape close it.
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open);
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.documentElement.classList.remove('menu-open'); };
  }, [open]);

  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" to="/" aria-label="GDoilco home">
          <Logo />
          <span><b>GDoilco</b><small>Energy workforce</small></span>
        </Link>
        <button className={'menu-btn' + (open ? ' is-open' : '')} type="button" aria-expanded={open} aria-controls="nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
          <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
        </button>
        <div className={'nav-backdrop' + (open ? ' on' : '')} onClick={() => setOpen(false)} aria-hidden="true" />
        <nav className={open ? 'nav open' : 'nav'} id="nav" aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end>{label}</NavLink>
          ))}
          <NavLink className="cta" to="/apply">Apply now</NavLink>
        </nav>
      </div>
    </header>
  );
}
