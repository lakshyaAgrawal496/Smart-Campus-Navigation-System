export default function CrowdIndicator({ level }) {
  const config = {
    Low:    { color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🟢', label: 'Low Crowd' },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '🟡', label: 'Moderate Crowd' },
    High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  icon: '🔴', label: 'High Crowd' },
  };
  const c = config[level] || config['Low'];

  return (
    <span className="crowd-badge" style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}40` }}>
      {c.icon} {c.label}
    </span>
  );
}
