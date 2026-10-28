import { useEffect, useState } from 'react';
import { ROLES } from '../data.js';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// The live list of positions, as set in the admin site. If the server cannot be reached
// (for example when only "npm run dev" is running) the sample list in src/data.js is shown instead.
export function usePositions() {
  const [state, setState] = useState({ roles: [], loading: true, live: false });
  useEffect(() => {
    let off = false;
    fetch(API + '/api/positions', { headers: { Accept: 'application/json' }, credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((d) => { if (!off && Array.isArray(d.positions)) setState({ roles: d.positions, loading: false, live: true }); else throw new Error('bad data'); })
      .catch(() => { if (!off) setState({ roles: ROLES, loading: false, live: false }); });
    return () => { off = true; };
  }, []);
  return state;
}
