import { useState } from 'react';

export default function SearchBar({ locations, onSearch, loading }) {
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (from && to && from !== to) onSearch(from, to);
  };

  const floors = ['All', '0', '1', '2', 'multi'];
  const [floorFilter, setFloorFilter] = useState('All');

  const filtered = floorFilter === 'All'
    ? locations
    : locations.filter(l => l.floor === floorFilter);

  const typeIcon = { facility: '🏛️', classroom: '📚', laboratory: '🔬', stairs: '🪜', cafeteria: '🍽️', parking: '🅿️', office: '💼', medical: '🏥', library: '📖' };

  return (
    <div className="search-panel">
      <div className="search-header">
        <h2 className="search-title">🧭 Find Your Way</h2>
        <p className="search-subtitle">Select source and destination to get the shortest path</p>
      </div>

      <div className="floor-filter">
        {floors.map(f => (
          <button key={f} className={`filter-btn ${floorFilter === f ? 'active' : ''}`} onClick={() => setFloorFilter(f)}>
            {f === 'All' ? '🏫 All' : f === 'multi' ? '🪜 Stairs' : `Floor ${f}`}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="select-group">
          <label className="select-label">📍 From</label>
          <select id="from-select" className="location-select" value={from} onChange={e => setFrom(e.target.value)} required>
            <option value="">— Select starting point —</option>
            {filtered.map(l => (
              <option key={l.id} value={l.id}>
                {typeIcon[l.type] || '📍'} {l.name} (Floor {l.floor})
              </option>
            ))}
          </select>
        </div>

        <div className="swap-btn-container">
          <button type="button" className="swap-btn" onClick={() => { const tmp = from; setFrom(to); setTo(tmp); }}>⇅</button>
        </div>

        <div className="select-group">
          <label className="select-label">🏁 To</label>
          <select id="to-select" className="location-select" value={to} onChange={e => setTo(e.target.value)} required>
            <option value="">— Select destination —</option>
            {filtered.map(l => (
              <option key={l.id} value={l.id}>
                {typeIcon[l.type] || '📍'} {l.name} (Floor {l.floor})
              </option>
            ))}
          </select>
        </div>

        <button id="find-path-btn" type="submit" className="btn-find-path" disabled={loading || !from || !to || from === to}>
          {loading ? <span className="btn-spinner" /> : '🔍 Find Shortest Path'}
        </button>
      </form>
    </div>
  );
}
