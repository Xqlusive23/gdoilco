export const DISCIPLINES = {
  drilling: 'Drilling',
  offshore: 'Offshore operations',
  marine: 'Marine and subsea',
  maintenance: 'Maintenance',
  hse: 'HSE and medical',
  support: 'Support and administration',
};

export const STATUS = { open: 'Open', closed: 'Closed' };

// Only roles with st: 'open' can be applied for. To reopen a role, change its st to 'open'.
export const isOpen = (r) => r.st === 'open';

// Sample listings. Edit this array to change the boards and the role list on the application form.
// rot is days on / days off for rotating crews, or a schedule label for shore-based jobs.
export const ROLES = [
  { ref: 'GD-1041', role: 'Driller', d: 'drilling', site: 'Jack-up rig, Gulf of Mexico', base: 'Lafayette, LA', rot: '14/14', certs: 'IADC WellSharp, SafeGulf, TWIC', st: 'closed' },
  { ref: 'GD-1042', role: 'Derrickhand', d: 'drilling', site: 'Semi-submersible, Gulf of Mexico', base: 'Lafayette, LA', rot: '14/14', certs: 'SafeGulf, HUET, TWIC', st: 'closed' },
  { ref: 'GD-1043', role: 'Roughneck', d: 'drilling', site: 'Land rig, Permian Basin', base: 'Midland, TX', rot: '14/14', certs: 'SafeLand, H2S Alive, first aid and CPR', st: 'closed' },
  { ref: 'GD-1044', role: 'Toolpusher', d: 'drilling', site: 'Jack-up rig, Gulf of Mexico', base: 'Lafayette, LA', rot: '21/21', certs: 'WellSharp supervisor, SafeGulf, TWIC', st: 'closed' },
  { ref: 'GD-1051', role: 'Crane Operator', d: 'offshore', site: 'Fixed platform', base: 'Lafayette, LA', rot: '7/7', certs: 'NCCCO offshore crane, SafeGulf, TWIC', st: 'closed' },
  { ref: 'GD-1052', role: 'Helideck Landing Officer', d: 'offshore', site: 'Fixed platform', base: 'Lafayette, LA', rot: '7/7', certs: 'HLO certificate, SafeGulf, TWIC', st: 'closed' },
  { ref: 'GD-1061', role: 'Marine Engineer', d: 'marine', site: 'Supply vessel', base: 'Houston, TX', rot: '28/28', certs: 'USCG MMC, STCW basic, TWIC', st: 'closed' },
  { ref: 'GD-1062', role: 'ROV Pilot Technician', d: 'marine', site: 'Drillship', base: 'Houston, TX', rot: '28/28', certs: 'ROV pilot certificate, SafeGulf, TWIC', st: 'closed' },
  { ref: 'GD-1071', role: 'Rig Electrician', d: 'maintenance', site: 'Jack-up rig, Gulf of Mexico', base: 'Lafayette, LA', rot: '14/14', certs: 'Journeyman license, SafeGulf, TWIC', st: 'closed' },
  { ref: 'GD-1072', role: 'Mechanical Fitter', d: 'maintenance', site: 'Semi-submersible, Gulf of Mexico', base: 'Houston, TX', rot: '14/14', certs: 'Trade certificate, SafeGulf, TWIC', st: 'closed' },
  { ref: 'GD-1081', role: 'HSE Advisor', d: 'hse', site: 'Drillship', base: 'Houston, TX', rot: '14/14', certs: 'OSHA 30, SafeGulf, TWIC', st: 'closed' },
  { ref: 'GD-1082', role: 'Offshore Medic', d: 'hse', site: 'Fixed platform', base: 'Lafayette, LA', rot: '14/14', certs: 'EMT or paramedic license, SafeGulf', st: 'closed' },
  { ref: 'GD-1091', role: 'Camp Boss', d: 'support', site: 'Land rig camp, Permian Basin', base: 'Midland, TX', rot: '14/14', certs: 'ServSafe Manager certificate', st: 'closed' },
  { ref: 'GD-1101', role: 'Disbursement Officer', d: 'support', site: 'Corporate office', base: 'Houston, TX', rot: 'Full-time', certs: 'Accounting or finance degree, A/P experience', st: 'open' },
];

// Edit these once: they appear on the Contact page and on the application form.
export const CONTACT = { email: 'careers@gdoilco.com', phone: '+1 (713) 555-0100' };
