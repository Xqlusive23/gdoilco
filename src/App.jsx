import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Jobs from './pages/Jobs.jsx';
import Safety from './pages/Safety.jsx';
import Contact from './pages/Contact.jsx';
import Apply from './pages/Apply.jsx';

// The admin site is loaded only when someone opens /admin, so the public site stays small.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

const TITLES = { '/': 'GDoilco', '/about': 'About | GDoilco', '/jobs': 'Jobs | GDoilco', '/safety': 'Safety | GDoilco', '/contact': 'Contact | GDoilco', '/apply': 'Apply | GDoilco' };

function useReducedMotion() {
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
}

const jumpTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
const jumpHash = (hash) => requestAnimationFrame(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView(); });

// Fades the current page out, swaps routes, then fades the next page in under a progress bar.
function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(location);
  const [stage, setStage] = useState('in'); // 'out' while the old page leaves, 'in' otherwise
  const [tick, setTick] = useState(0);
  const latest = useRef(location);
  latest.current = location;

  useEffect(() => {
    document.title = TITLES[location.pathname] || 'GDoilco';
    if (location.pathname !== shown.pathname) {
      if (reduce) { setShown(location); jumpTop(); jumpHash(location.hash); }
      else { setStage('out'); setTick((t) => t + 1); }
    } else if (location !== shown) {
      setShown(location); // same page, new query string or hash: update without a transition
      jumpHash(location.hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const onAnimationEnd = (e) => {
    if (e.target !== e.currentTarget || stage !== 'out') return;
    setShown(latest.current);
    setStage('in');
    jumpTop();
    jumpHash(latest.current.hash);
  };

  return (
    <>
      {tick > 0 && <div key={tick} className="route-bar" aria-hidden="true" />}
      <div className={'route-page ' + stage} onAnimationEnd={onAnimationEnd}>
        <Routes location={shown}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/safety" element={<Safety />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return <Suspense fallback={null}><AdminApp /></Suspense>;
  return (
    <>
      <Header />
      <main id="main"><AnimatedRoutes /></main>
      <Footer />
    </>
  );
}
