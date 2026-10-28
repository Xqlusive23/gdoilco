import { Link } from 'react-router-dom';
import { Logo } from './Icons.jsx';

export default function Footer() {
  return (
    <>
      <div className="rule-gold" aria-hidden="true" />
      <footer className="site-footer">
        <div className="wrap">
          <div>
            <Link className="brand" to="/"><Logo /><span><b>GDoilco</b><small>Energy workforce</small></span></Link>
            <p>Recruiting, vetting and rotating drilling, offshore and marine crews for operators on the Gulf Coast and in the Permian Basin.</p>
          </div>
          <div>
            <h4>Pages</h4>
            <Link to="/">Home</Link><Link to="/about">About</Link><Link to="/jobs">Jobs</Link><Link to="/safety">Safety</Link><Link to="/contact">Contact</Link>
          </div>
          <div>
            <h4>Candidates</h4>
            <Link to="/apply">Application form</Link><Link to="/jobs">Open positions</Link><Link to="/safety#readiness">Readiness checklist</Link>
          </div>
        </div>
        <div className="legal">
          <div className="wrap"><span>&copy; {new Date().getFullYear()} GDoilco. All rights reserved.</span><span>Photography and video from <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>.</span></div>
        </div>
      </footer>
    </>
  );
}
