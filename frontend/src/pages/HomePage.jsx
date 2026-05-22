import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import MapCanvas from '../components/MapCanvas';
import PathResult from '../components/PathResult';
import CrowdIndicator from '../components/CrowdIndicator';
import client from '../api/client';

export default function HomePage() {
  const [locations, setLocations] = useState([]);
  const [edges, setEdges]         = useState([]);
  const [crowdData, setCrowdData] = useState([]);
  const [pathResult, setPathResult] = useState(null);
  const [searching, setSearching]   = useState(false);
  const [error, setError]           = useState('');
  const [activeTab, setActiveTab]   = useState('map'); // 'map' | 'directions' | 'crowd'

  useEffect(() => {
    Promise.all([
      client.get('/locations'),
      client.get('/crowd'),
    ]).then(([locRes, crowdRes]) => {
      setLocations(locRes.data);
      // Extract edges from backend (we store them separately)
      setCrowdData(crowdRes.data);
    }).catch(err => setError(err.response?.data?.error || 'Failed to load campus data'));

    // Fetch edges via a custom call (reuse locations data builds edges)
    fetchEdges();
  }, []);

  const fetchEdges = async () => {
    try {
      // We'll derive edges by fetching the graph via a navigation probe
      // Use a simpler approach: request raw edge data from locations route
      const res = await client.get('/locations');
      setLocations(res.data);
    } catch {}
  };

  const refreshCrowd = async () => {
    const res = await client.get('/crowd');
    setCrowdData(res.data);
  };

  const handleSearch = async (from, to) => {
    setSearching(true); setError(''); setPathResult(null);
    try {
      const res = await client.get(`/navigation/shortest-path?from=${from}&to=${to}`);
      setPathResult(res.data);
      setActiveTab('directions');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not compute path');
    } finally {
      setSearching(false);
    }
  };

  // Build edges from crowd data coordinates (all location pairs that share edges)
  // We'll load them with a dedicated backend call
  useEffect(() => {
    client.get('/locations').then(res => {
      // Build a visual edge list from known adjacency
      // Edges come embedded in the path result; for full display we'll derive from navigation
      loadEdges();
    });
  }, []);

  const loadEdges = async () => {
    try {
      // Trigger a dummy path to get the full graph structure, or just use static edge list
      // For map display, we derive from locations (stored edges in DB come via navigation engine)
      // We add an /edges endpoint call:
      const res = await client.get('/locations/edges/all').catch(() => ({ data: [] }));
      if (res.data?.length) setEdges(res.data);
    } catch {}
  };

  const crowdSummary = {
    Low:    crowdData.filter(c => c.level === 'Low').length,
    Medium: crowdData.filter(c => c.level === 'Medium').length,
    High:   crowdData.filter(c => c.level === 'High').length,
  };

  return (
    <div className="app-layout">
      <Navbar />
      <div className="home-content">
        {/* Left Panel */}
        <aside className="left-panel">
          <SearchBar locations={locations} onSearch={handleSearch} loading={searching} />

          {error && <div className="alert alert-error" style={{ margin: '12px 0' }}>❌ {error}</div>}

          <div className="tab-nav">
            <button className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>🗺️ Map</button>
            <button className={`tab-btn ${activeTab === 'directions' ? 'active' : ''}`} onClick={() => setActiveTab('directions')}>🧭 Directions</button>
            <button className={`tab-btn ${activeTab === 'crowd' ? 'active' : ''}`} onClick={() => setActiveTab('crowd')}>👥 Crowd</button>
          </div>

          {activeTab === 'directions' && (
            pathResult
              ? <PathResult result={pathResult} locations={locations} />
              : <div className="empty-state">🔍 Search for a path to see directions</div>
          )}

          {activeTab === 'crowd' && (
            <div className="crowd-panel">
              <div className="crowd-summary">
                <div className="crowd-stat low"><span className="stat-num">{crowdSummary.Low}</span><span>Low</span></div>
                <div className="crowd-stat medium"><span className="stat-num">{crowdSummary.Medium}</span><span>Medium</span></div>
                <div className="crowd-stat high"><span className="stat-num">{crowdSummary.High}</span><span>High</span></div>
              </div>
              <div className="crowd-list">
                {crowdData.map(c => (
                  <div key={c.node_id} className="crowd-item">
                    <div className="crowd-item-name">
                      <span className="crowd-node-id">{c.node_id}</span>
                      <span>{c.name}</span>
                    </div>
                    <CrowdIndicator level={c.level} />
                  </div>
                ))}
              </div>
              <button className="btn-refresh" onClick={refreshCrowd}>🔄 Refresh Crowd Data</button>
            </div>
          )}
        </aside>

        {/* Main Map Area */}
        <main className="map-area">
          <div className="map-header">
            <div className="map-title-group">
              <h2 className="map-title">JIIT Noida — Campus Map</h2>
              <span className="map-subtitle">{locations.length} locations · {crowdSummary.High} high-density zones</span>
            </div>
            {pathResult && (
              <div className="path-badge">
                {pathResult.rerouted ? '⚡ Smart Route Active' : '✅ Route Active'} · {pathResult.trueDistance || pathResult.totalDistance}m · ⏱️ {pathResult.estimatedTime || 1} min
              </div>
            )}
          </div>
          <MapCanvas
            locations={locations}
            edges={edges}
            crowdData={crowdData}
            pathResult={pathResult}
          />
        </main>
      </div>
    </div>
  );
}
