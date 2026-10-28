// A scrolling ticker. Pauses on hover and focus. With reduced motion it becomes a static, wrapped list.
// tone: 'dark' (signal amber on dark) or 'accent' (white on the brand orange)
export default function Marquee({ items, tone = 'dark', seconds = 40, label = 'Highlights' }) {
  const row = (hidden) => (
    <ul className="marquee-row" aria-hidden={hidden ? 'true' : undefined}>
      {items.map((t) => (
        <li key={t}>{t}<span className="marquee-dot" aria-hidden="true" /></li>
      ))}
    </ul>
  );
  return (
    <div className={'marquee ' + tone} role="group" aria-label={label}>
      <div className="marquee-track" style={{ '--dur': seconds + 's' }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
