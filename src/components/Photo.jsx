import { useCallback, useState } from 'react';

// A real photo that tries each address in `srcs` in turn. With `live` it drifts slowly (a gentle zoom),
// so a still picture feels alive. If every address fails it shows `fallback` (a drawn scene or a plain panel).
export default function Photo({ srcs, pos = 'center', alt = '', live = false, fallback, className = '', eager = false }) {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const ref = useCallback((el) => { if (el && el.complete && el.naturalWidth > 0) setReady(true); }, []);

  if (i >= srcs.length) return fallback !== undefined ? fallback : <div className={'photo-fallback ' + className} role="presentation" />;
  return (
    <img
      key={srcs[i]}
      ref={ref}
      className={['photo', live && 'live', ready && 'ready', className].filter(Boolean).join(' ')}
      src={srcs[i]}
      alt={alt}
      style={{ objectPosition: pos }}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onLoad={() => setReady(true)}
      onError={() => { setReady(false); setI((n) => n + 1); }}
    />
  );
}
