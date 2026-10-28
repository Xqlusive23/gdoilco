import { useEffect, useRef, useState } from 'react';

// Set to true if you also want the background videos to play on phones (they use mobile data).
const VIDEO_ON_MOBILE = false;

function videoAllowed() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const c = navigator.connection;
  const saver = !!c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''));
  const small = window.matchMedia('(max-width: 700px)').matches;
  return !reduce && !saver && (VIDEO_ON_MOBILE || !small);
}

// A muted, looping background video that starts by itself. It pauses when scrolled out of view,
// and a button lets the visitor stop it. Where video is not wanted (reduced motion, data saver, phones)
// nothing is drawn and the photo underneath stays.
export default function VideoBg({ sources, control = true }) {
  const ref = useRef(null);
  const [allowed] = useState(videoAllowed);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    const v = ref.current;
    if (!v || !allowed) return undefined;
    v.muted = true; // browsers only allow autoplay when muted
    const play = () => { if (!pausedRef.current) v.play().catch(() => {}); };
    play();
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) play(); else v.pause(); }, { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, [allowed, failed]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (paused) v.pause(); else v.play().catch(() => {});
  }, [paused]);

  if (!allowed || failed) return null;
  return (
    <>
      <video
        ref={ref}
        className={'bg-video' + (ready ? ' ready' : '')}
        muted loop playsInline autoPlay preload="auto" aria-hidden="true" tabIndex={-1}
        onPlaying={() => setReady(true)}
      >
        {sources.map((s, n) => (
          <source key={s} src={s} onError={n === sources.length - 1 ? () => setFailed(true) : undefined} />
        ))}
      </video>
      {control && ready && (
        <button type="button" className="video-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)} aria-label={paused ? 'Play background video' : 'Pause background video'}>
          {paused
            ? <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
            : <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>}
        </button>
      )}
    </>
  );
}
