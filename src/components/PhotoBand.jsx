import Photo from './Photo.jsx';
import { PHOTOS } from '../media.js';

// A wide photo with a short quote or statement over it. photo is a key from src/media.js.
export default function PhotoBand({ photo, children }) {
  const p = PHOTOS[photo];
  return (
    <section className="photoband">
      <Photo srcs={p.srcs} pos={p.pos} live className="band-photo" fallback={<div className="photo-fallback band-photo" />} />
      <div className="wrap photoband-inner"><p>{children}</p></div>
    </section>
  );
}
