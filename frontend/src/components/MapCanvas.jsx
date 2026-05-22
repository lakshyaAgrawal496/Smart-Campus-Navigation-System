import { useEffect, useRef } from 'react';

const NODE_RADIUS = 14;
const CROWD_COLOR = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
const TYPE_COLOR  = {
  facility: '#6366f1', classroom: '#3b82f6', laboratory: '#8b5cf6',
  stairs: '#94a3b8', cafeteria: '#f97316', parking: '#64748b',
  office: '#ec4899', medical: '#ef4444', library: '#14b8a6'
};

export default function MapCanvas({ locations, edges, crowdData, pathResult }) {
  const svgRef = useRef(null);

  const crowdMap = {};
  crowdData.forEach(c => { crowdMap[c.node_id] = c; });

  const nodeMap = {};
  locations.forEach(n => { nodeMap[n.id] = n; });

  const pathSet = new Set(pathResult?.path || []);
  const pathEdges = new Set();
  if (pathResult?.path) {
    for (let i = 0; i < pathResult.path.length - 1; i++) {
      pathEdges.add(`${pathResult.path[i]}-${pathResult.path[i + 1]}`);
      pathEdges.add(`${pathResult.path[i + 1]}-${pathResult.path[i]}`);
    }
  }

  const isPathEdge = (src, tgt) => pathEdges.has(`${src}-${tgt}`);

  // Tooltip state via DOM
  const showTooltip = (e, node, crowd) => {
    const svg = svgRef.current;
    if (!svg) return;
    let tip = document.getElementById('map-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'map-tooltip';
      tip.className = 'map-tooltip';
      svg.parentElement.appendChild(tip);
    }
    const rect = svg.getBoundingClientRect();
    tip.innerHTML = `<strong>${node.name}</strong><br/>Floor: ${node.floor}<br/>Type: ${node.type}<br/>Crowd: ${crowd?.level || 'Low'}`;
    tip.style.left = (e.clientX - rect.left + 12) + 'px';
    tip.style.top  = (e.clientY - rect.top  - 10) + 'px';
    tip.style.opacity = '1';
  };

  const hideTooltip = () => {
    const tip = document.getElementById('map-tooltip');
    if (tip) tip.style.opacity = '0';
  };

  if (!locations.length) {
    return (
      <div className="map-empty">
        <div className="map-loading-icon">🗺️</div>
        <p>Loading campus map…</p>
      </div>
    );
  }

  // SVG viewBox bounds
  const allX = locations.map(n => n.x);
  const allY = locations.map(n => n.y);
  const minX = Math.min(...allX) - 60;
  const minY = Math.min(...allY) - 60;
  const maxX = Math.max(...allX) + 60;
  const maxY = Math.max(...allY) + 60;
  const W = maxX - minX;
  const H = maxY - minY;

  return (
    <div className="map-container">
      {/* Legend */}
      <div className="map-legend">
        <div className="legend-section">
          <span className="legend-title">Location Types</span>
          {Object.entries(TYPE_COLOR).map(([type, color]) => (
            <div key={type} className="legend-item">
              <div className="legend-dot" style={{ background: color }} />
              <span>{type}</span>
            </div>
          ))}
        </div>
        <div className="legend-section">
          <span className="legend-title">Crowd Level</span>
          {Object.entries(CROWD_COLOR).map(([level, color]) => (
            <div key={level} className="legend-item">
              <div className="legend-ring" style={{ borderColor: color }} />
              <span>{level}</span>
            </div>
          ))}
        </div>
        {pathResult && (
          <div className="legend-section">
            <div className="legend-item">
              <div className="legend-path-line" />
              <span>Active Path</span>
            </div>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        className="campus-svg"
        viewBox={`${minX} ${minY} ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter for path */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Animated path dash */}
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#6366f1" />
          </marker>
        </defs>

        {/* Grid background */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        </pattern>
        <rect x={minX} y={minY} width={W} height={H} fill="url(#grid)" />

        {/* Floor labels */}
        {['0','1','2'].map(floor => {
          const floorNodes = locations.filter(n => n.floor === floor);
          if (!floorNodes.length) return null;
          const avgY = floorNodes.reduce((s,n) => s + n.y, 0) / floorNodes.length;
          return (
            <text key={floor} x={minX + 10} y={avgY} className="floor-label" fill="rgba(255,255,255,0.15)" fontSize="28" fontWeight="bold">
              Floor {floor}
            </text>
          );
        })}

        {/* Edges */}
        {edges.map((edge, i) => {
          const src = nodeMap[edge.source];
          const tgt = nodeMap[edge.target];
          if (!src || !tgt) return null;
          const isPath = isPathEdge(edge.source, edge.target);
          if (!isPath) return null; // Don't show every connection, only the active path

          return (
            <g key={i}>
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke="#6366f1"
                strokeWidth="4"
                strokeDasharray="8 4"
                style={{ filter: 'drop-shadow(0px 0px 4px rgba(99,102,241,0.8))' }}
                className="path-edge"
              />
            </g>
          );
        })}

        {/* Path distance labels */}
        {pathResult?.steps?.map((step, i) => {
          const src = nodeMap[step.from];
          const tgt = nodeMap[step.to];
          if (!src || !tgt) return null;
          return (
            <text key={i} x={(src.x + tgt.x) / 2} y={(src.y + tgt.y) / 2 - 6}
              fill="#a5b4fc" fontSize="10" textAnchor="middle" fontWeight="bold">
              {step.distance}m
            </text>
          );
        })}

        {/* Nodes */}
        {locations.map(node => {
          const crowd  = crowdMap[node.id];
          const inPath = pathSet.has(node.id);
          const isStart= pathResult?.path?.[0] === node.id;
          const isEnd  = pathResult?.path?.[pathResult.path.length - 1] === node.id;
          const crowdColor = CROWD_COLOR[crowd?.level] || CROWD_COLOR.Low;
          const fillColor  = TYPE_COLOR[node.type] || '#6366f1';

          return (
            <g key={node.id} className="map-node" style={{ cursor: 'pointer' }}
              onMouseEnter={e => showTooltip(e, node, crowd)}
              onMouseLeave={hideTooltip}
            >
              {/* Crowd ring */}
              <circle cx={node.x} cy={node.y} r={NODE_RADIUS + 5}
                fill="none" stroke={crowdColor} strokeWidth={inPath ? 2.5 : 1.5}
                opacity={crowd?.level === 'High' ? 1 : crowd?.level === 'Medium' ? 0.7 : 0.3}
              />
              {/* Node body */}
              <circle cx={node.x} cy={node.y} r={NODE_RADIUS}
                fill={inPath ? fillColor : `${fillColor}99`}
                stroke={inPath ? '#fff' : `${fillColor}66`}
                strokeWidth={inPath ? 2.5 : 1.5}
                style={inPath ? { filter: 'drop-shadow(0px 0px 6px rgba(255,255,255,0.4))' } : {}}
              />
              {/* Start/End markers */}
              {isStart && (
                <circle cx={node.x} cy={node.y} r={NODE_RADIUS + 9}
                  fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3"
                  className="pulse-ring"
                />
              )}
              {isEnd && (
                <circle cx={node.x} cy={node.y} r={NODE_RADIUS + 9}
                  fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3"
                  className="pulse-ring"
                />
              )}
              {/* Node ID label */}
              <text x={node.x} y={node.y + 4} fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">{node.id}</text>
              {/* Node name label */}
              <text x={node.x} y={node.y + NODE_RADIUS + 14} fill={inPath ? '#e2e8f0' : 'rgba(203,213,225,0.7)'}
                fontSize="9" textAnchor="middle" fontWeight={inPath ? 'bold' : 'normal'}>
                {node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
