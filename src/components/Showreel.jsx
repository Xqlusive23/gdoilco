import { useEffect, useRef, useState } from 'react';
import Scene from './Scene.jsx';
import Photo from './Photo.jsx';
import { PHOTOS } from '../media.js';

const CHAPTERS = [
  { scene: 'dawn', rigX: 0.74, photo: 'glow', kicker: 'Find the role', title: 'Read the crew change board', text: 'Every position shows its rotation, base and the certificates it needs before you apply.' },
  { scene: 'day', rigX: 0.7, photo: 'platform', kicker: 'Apply online', title: 'One form, about ten minutes', text: 'Tell us your experience and upload your ID. Your details travel over an encrypted connection.' },
  { scene: 'dusk', rigX: 0.74, photo: 'sunset', kicker: 'Get cleared', title: 'Certificates, physical and drug screen', text: 'We verify your TWIC card, safety orientation and references, then book your physical.' },
  { scene: 'night', rigX: 0.72, photo: 'dusk', kicker: 'Start work', title: 'Joining instructions arrive', text: 'You receive your schedule and start date, then report to your base or head out to the rig.' },
];
const SECONDS = 7;

// A short guided tour of how GDoilco hiring works, drawn live on a canvas.
export default function Showreel() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [run, setRun] = useState(0); // bumps on resume so the chapter and its progress bar restart together
  const reduce = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (!playing || reduce.current) return undefined;
    const id = setTimeout(() => setI((n) => (n + 1) % CHAPTERS.length), SECONDS * 1000);
    return () => clearTimeout(id);
  }, [i, playing, run]);

  const c = CHAPTERS[i];
  return (
    <div className="reel" role="region" aria-label="How GDoilco hiring works">
      <div className="reel-stage">
        {CHAPTERS.map((ch, n) => (
          <Photo
            key={ch.photo}
            srcs={PHOTOS[ch.photo].srcs}
            pos={PHOTOS[ch.photo].pos}
            live={n === i}
            className={'reel-photo' + (n === i ? ' on' : '')}
            fallback={n === i ? <Scene scene={ch.scene} rigX={ch.rigX} /> : null}
          />
        ))}
        <div className="reel-top">
          <span className="reel-live"><i aria-hidden="true" />GDoilco · How hiring works</span>
          <span className="reel-count">{String(i + 1).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}</span>
        </div>
        <div className="reel-caption" key={'cap' + i} aria-live="polite">
          <span className="reel-kicker">{c.kicker}</span>
          <strong>{c.title}</strong>
          <p>{c.text}</p>
        </div>
      </div>
      <div className="reel-bar">
        <button type="button" className="reel-play" aria-pressed={!playing} onClick={() => { if (!playing) setRun((r) => r + 1); setPlaying(!playing); }} aria-label={playing ? 'Pause tour' : 'Play tour'}>
          {playing
            ? <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
            : <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>}
        </button>
        <ol className="reel-chapters">
          {CHAPTERS.map((ch, n) => (
            <li key={ch.kicker}>
              <button type="button" aria-current={n === i ? 'step' : undefined} onClick={() => setI(n)}>
                <span>{ch.kicker}</span>
                <i className="reel-prog"><b key={n === i ? `on-${i}-${run}` : `off-${n}`} className={n < i ? 'full' : n === i ? (reduce.current ? 'full' : 'run' + (playing ? '' : ' paused')) : ''} style={{ '--sec': SECONDS + 's' }} /></i>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
