import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import CrowdIndicator from '../components/CrowdIndicator';
import client from '../api/client';

export default function AdminPage() {
  const [locations, setLocations] = useState([]);
  const [crowdData, setCrowdData] = useState([]);
  const [activeTab, setActiveTab] = useState('crowd');
  const [msg, setMsg]   = useState('');
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  // Add location form state
  const [newLoc, setNewLoc] = useState({ id: '', name: '', floor: '0', x: '', y: '', type: 'classroom', description: '', connectedNodeId: '', edgeDistance: 10 });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [locRes, crowdRes] = await Promise.all([client.get('/locations'), client.get('/crowd')]);
    setLocations(locRes.data);
    setCrowdData(crowdRes.data);
  };

  const flash = (message, isErr = false) => {
    if (isErr) { setErr(message); setMsg(''); } else { setMsg(message); setErr(''); }
    setTimeout(() => { setMsg(''); setErr(''); }, 4000);
  };

  // ── Crowd Update ──────────────────────────────────────────────────────────
  const handleCrowdUpdate = async (nodeId, level) => {
    try {
      await client.put(`/crowd/${nodeId}`, { level });
      setCrowdData(prev => prev.map(c => c.node_id === nodeId ? { ...c, level, multiplier: { Low: 1.0, Medium: 2.5, High: 5.0 }[level] } : c));
      flash(`✅ Updated crowd for ${nodeId} to ${level}`);
    } catch (e) { flash(e.response?.data?.error || 'Update failed', true); }
  };

  // ── Add Location ──────────────────────────────────────────────────────────
  const handleAddLocation = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const res = await client.post('/locations', { 
        ...newLoc, 
        x: Number(newLoc.x), 
        y: Number(newLoc.y),
        edgeDistance: Number(newLoc.edgeDistance)
      });
      setLocations(prev => [...prev, res.data]);
      setNewLoc({ id: '', name: '', floor: '0', x: '', y: '', type: 'classroom', description: '', connectedNodeId: '', edgeDistance: 10 });
      flash('✅ Location added successfully!');
    } catch (e) { flash(e.response?.data?.error || 'Failed to add location', true); }
    finally { setLoading(false); }
  };

  // ── Delete Location ───────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm(`Delete location ${id}?`)) return;
    try {
      await client.delete(`/locations/${id}`);
      setLocations(prev => prev.filter(l => l.id !== id));
      flash(`✅ Location ${id} deleted`);
    } catch (e) { flash(e.response?.data?.error || 'Delete failed', true); }
  };

  const typeOptions = ['facility','classroom','laboratory','stairs','cafeteria','parking','office','medical','library'];
  const typeIcon = { facility: '🏛️', classroom: '📚', laboratory: '🔬', stairs: '🪜', cafeteria: '🍽️', parking: '🅿️', office: '💼', medical: '🏥', library: '📖' };
  const crowdColors = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

  return (
    <div className="app-layout">
      <Navbar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Manage campus locations and real-time crowd density data</p>
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}
        {err && <div className="alert alert-error">{err}</div>}

        {/* Stats Bar */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="stat-icon">📍</span>
            <span className="stat-value">{locations.length}</span>
            <span className="stat-label">Total Locations</span>
          </div>
          <div className="admin-stat-card">
            <span className="stat-icon">🔴</span>
            <span className="stat-value">{crowdData.filter(c=>c.level==='High').length}</span>
            <span className="stat-label">High Density Zones</span>
          </div>
          <div className="admin-stat-card">
            <span className="stat-icon">🟡</span>
            <span className="stat-value">{crowdData.filter(c=>c.level==='Medium').length}</span>
            <span className="stat-label">Medium Density Zones</span>
          </div>
          <div className="admin-stat-card">
            <span className="stat-icon">🟢</span>
            <span className="stat-value">{crowdData.filter(c=>c.level==='Low').length}</span>
            <span className="stat-label">Low Density Zones</span>
          </div>
        </div>

        <div className="admin-tabs">
          <button className={`tab-btn ${activeTab==='crowd'?'active':''}`} onClick={()=>setActiveTab('crowd')}>👥 Crowd Management</button>
          <button className={`tab-btn ${activeTab==='locations'?'active':''}`} onClick={()=>setActiveTab('locations')}>📍 Manage Locations</button>
          <button className={`tab-btn ${activeTab==='add'?'active':''}`} onClick={()=>setActiveTab('add')}>➕ Add Location</button>
        </div>

        {/* Crowd Management */}
        {activeTab === 'crowd' && (
          <div className="admin-section">
            <h2>Real-Time Crowd Density Control</h2>
            <p className="section-desc">Update crowd levels for any campus location. High density triggers smart rerouting for users.</p>
            <div className="crowd-grid">
              {crowdData.map(c => (
                <div key={c.node_id} className="crowd-control-card" style={{ borderColor: `${crowdColors[c.level]}44` }}>
                  <div className="crowd-card-header">
                    <div>
                      <span className="crowd-node-badge">{c.node_id}</span>
                      <span className="crowd-node-name">{c.name}</span>
                    </div>
                    <span className="crowd-floor">Floor {c.floor}</span>
                  </div>
                  <div className="crowd-card-status">
                    <CrowdIndicator level={c.level} />
                    <span className="multiplier-badge">×{c.multiplier} weight</span>
                  </div>
                  <div className="crowd-control-btns">
                    {['Low','Medium','High'].map(level => (
                      <button key={level}
                        className={`crowd-level-btn level-${level.toLowerCase()} ${c.level===level?'active':''}`}
                        onClick={() => handleCrowdUpdate(c.node_id, level)}>
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="crowd-updated">Last: {new Date(c.last_updated).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location List */}
        {activeTab === 'locations' && (
          <div className="admin-section">
            <h2>Campus Locations ({locations.length})</h2>
            <div className="locations-table-wrap">
              <table className="locations-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Floor</th><th>Type</th><th>Coordinates</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map(l => (
                    <tr key={l.id}>
                      <td><span className="node-id-badge">{l.id}</span></td>
                      <td>{typeIcon[l.type]} {l.name}</td>
                      <td>{l.floor}</td>
                      <td><span className="type-badge">{l.type}</span></td>
                      <td>({l.x}, {l.y})</td>
                      <td>
                        <button className="btn-danger-sm" onClick={() => handleDelete(l.id)}>🗑 Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Location */}
        {activeTab === 'add' && (
          <div className="admin-section">
            <h2>Add New Campus Location</h2>
            <form className="add-location-form" onSubmit={handleAddLocation}>
              <div className="form-row">
                <div className="form-group">
                  <label>Node ID (e.g. N26)</label>
                  <input type="text" value={newLoc.id} onChange={e=>setNewLoc({...newLoc,id:e.target.value})} placeholder="N26" required />
                </div>
                <div className="form-group">
                  <label>Location Name</label>
                  <input type="text" value={newLoc.name} onChange={e=>setNewLoc({...newLoc,name:e.target.value})} placeholder="Conference Hall" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Floor</label>
                  <select value={newLoc.floor} onChange={e=>setNewLoc({...newLoc,floor:e.target.value})}>
                    <option value="0">Ground (0)</option>
                    <option value="1">Floor 1</option>
                    <option value="2">Floor 2</option>
                    <option value="multi">Multi (Stairs)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={newLoc.type} onChange={e=>setNewLoc({...newLoc,type:e.target.value})}>
                    {typeOptions.map(t => <option key={t} value={t}>{typeIcon[t]} {t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>X Coordinate</label>
                  <input type="number" value={newLoc.x} onChange={e=>setNewLoc({...newLoc,x:e.target.value})} placeholder="300" required />
                </div>
                <div className="form-group">
                  <label>Y Coordinate</label>
                  <input type="number" value={newLoc.y} onChange={e=>setNewLoc({...newLoc,y:e.target.value})} placeholder="200" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Connect to Node (Optional)</label>
                  <select value={newLoc.connectedNodeId} onChange={e=>setNewLoc({...newLoc,connectedNodeId:e.target.value})}>
                    <option value="">None (Isolated)</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.id} - {l.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Distance to Node (m)</label>
                  <input type="number" value={newLoc.edgeDistance} onChange={e=>setNewLoc({...newLoc,edgeDistance:e.target.value})} placeholder="10" />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input type="text" value={newLoc.description} onChange={e=>setNewLoc({...newLoc,description:e.target.value})} placeholder="Optional description" />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : '➕ Add Location'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
