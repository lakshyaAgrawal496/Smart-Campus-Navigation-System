import CrowdIndicator from './CrowdIndicator';

export default function PathResult({ result, locations }) {
  if (!result) return null;

  const nodeMap = {};
  locations.forEach(l => { nodeMap[l.id] = l; });

  const typeIcon = { facility: '🏛️', classroom: '📚', laboratory: '🔬', stairs: '🪜', cafeteria: '🍽️', parking: '🅿️', office: '💼', medical: '🏥', library: '📖' };

  return (
    <div className={`path-result ${result.rerouted ? 'rerouted' : ''}`}>
      <div className="path-result-header">
        <h3>
          {result.rerouted ? '⚡ Smart Route Applied' : '✅ Shortest Path Found'}
        </h3>
        <div className="path-stats">
          <span className="stat-badge">📏 {result.trueDistance || result.totalDistance}m</span>
          <span className="stat-badge">⏱️ {result.estimatedTime || 1} min</span>
          <span className="stat-badge">🚶 {result.path?.length} stops</span>
          {result.rerouted && <span className="stat-badge rerouted-badge">🔄 Rerouted</span>}
        </div>
      </div>

      {result.rerouted && (
        <div className="reroute-notice">
          ⚠️ High crowd detected. Route has been optimized to avoid congested areas.
        </div>
      )}

      {result.crowdWarnings?.length > 0 && (
        <div className="crowd-warnings">
          <strong>Crowd Alerts Along Route:</strong>
          {result.crowdWarnings.map(w => (
            <span key={w.nodeId} className="warning-item">
              {nodeMap[w.nodeId]?.name}: <CrowdIndicator level={w.level} />
            </span>
          ))}
        </div>
      )}

      <div className="path-steps">
        <h4>Step-by-Step Directions</h4>
        <div className="steps-list">
          {result.path?.map((nodeId, idx) => {
            const node = nodeMap[nodeId];
            const isFirst = idx === 0;
            const isLast  = idx === result.path.length - 1;
            return (
              <div key={nodeId} className={`step-item ${isFirst ? 'step-start' : ''} ${isLast ? 'step-end' : ''}`}>
                <div className="step-indicator">
                  <div className="step-dot">
                    {isFirst ? '🟢' : isLast ? '🔴' : '⚪'}
                  </div>
                  {!isLast && <div className="step-line" />}
                </div>
                <div className="step-content">
                  <span className="step-icon">{typeIcon[node?.type] || '📍'}</span>
                  <div className="step-info">
                    <span className="step-name">{node?.name || nodeId}</span>
                    <span className="step-meta">Floor {node?.floor} · {node?.type}</span>
                    {result.steps?.[idx - 1] && (
                      <span className="step-distance">📏 {result.steps[idx - 1].distance}m</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
