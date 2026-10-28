import Scene from './Scene.jsx';
import Photo from './Photo.jsx';
import VideoBg from './VideoBg.jsx';
import { PHOTOS, VIDEOS } from '../media.js';

// photo: a key from PHOTOS (src/media.js). video: a key from VIDEOS, plays by itself over the photo.
// scene/rigX: the drawn rig scene, used only if the photo cannot load.
export default function Hero({ photo = 'sunset', video, scene = 'dusk', rigX = 0.75, eyebrow, title, lede, page = true, children }) {
  const p = PHOTOS[photo] || PHOTOS.sunset;
  return (
    <>
      <section className={page ? 'hero page' : 'hero'}>
        <Photo srcs={p.srcs} pos={p.pos} live eager className="hero-photo" fallback={<Scene scene={scene} rigX={rigX} />} />
        {video && <VideoBg sources={VIDEOS[video]} />}
        <div className="wrap hero-inner">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
          {children}
        </div>
      </section>
      <div className="rule-gold" aria-hidden="true" />
    </>
  );
}
