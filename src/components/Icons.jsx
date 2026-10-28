export function Logo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
      <path d="M20 5 L31 35 M20 5 L9 35 M13 24 H27 M11 30 H29 M5 37 H35" />
      <rect x="16" y="2" width="8" height="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

const PATHS = {
  drilling: <path d="M12 2l5 14M12 2L7 16M9.5 9h5M8.2 13h7.6M12 16v6M9.5 22h5" />,
  offshore: <path d="M3 5h18M12 5v3M6 12.5C6 10 8.5 8 12 8h4l4 3.5V15H6zM5 20h14M9 15v5M15 15v5" />,
  marine: (<><circle cx="12" cy="5" r="2.2" /><path d="M12 7.2V21M7 11h10M4 15c0 4 4 6 8 6s8-2 8-6" /></>),
  maintenance: <path d="M20.5 7.5a5 5 0 0 1-6.9 4.6L5.4 20.3 3.7 18.6l8.2-8.2A5 5 0 0 1 16.5 3.5l-2.8 2.8 2 2z" />,
  hse: (<><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" /><path d="M12 8v7M8.5 11.5h7" /></>),
  support: <path d="M9 3h6l1 2h3v16H5V5h3zM8.5 11h7M8.5 15h7M8.5 18.5h4" />,
};

export function DisciplineIcon({ name }) {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
