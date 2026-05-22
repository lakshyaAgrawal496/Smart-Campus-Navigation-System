/**
 * NavigationEngine – Dijkstra's Algorithm with Crowd Density Weighting
 * Implements Smart Rerouting: High-density nodes penalized with multiplier
 */
class NavigationEngine {
  constructor(nodes, edges, crowdData) {
    this.nodes = nodes;
    this.crowdMap = {};
    this.adjacencyList = {};

    // Build crowd lookup map
    crowdData.forEach(c => {
      this.crowdMap[c.node_id] = { level: c.level, multiplier: c.multiplier };
    });

    // Initialize adjacency list
    nodes.forEach(n => { this.adjacencyList[n.id] = []; });

    // Build adjacency list with crowd-weighted distances
    edges.forEach(edge => {
      const crowdTarget = this.crowdMap[edge.target] || { multiplier: 1.0 };
      const crowdSource = this.crowdMap[edge.source] || { multiplier: 1.0 };

      // Apply crowd penalty to both directions
      const weightFwd = edge.distance * crowdTarget.multiplier;
      const weightBwd = edge.distance * crowdSource.multiplier;

      this.adjacencyList[edge.source].push({ node: edge.target, weight: weightFwd, baseDistance: edge.distance, description: edge.description });
      this.adjacencyList[edge.target].push({ node: edge.source, weight: weightBwd, baseDistance: edge.distance, description: edge.description });
    });
  }

  findShortestPath(startId, endId) {
    if (!this.adjacencyList[startId] || !this.adjacencyList[endId]) {
      return { error: 'Invalid node IDs' };
    }
    if (startId === endId) {
      return { path: [startId], totalDistance: 0, steps: [], rerouted: false };
    }

    const distances = {};
    const prev = {};
    const visited = new Set();

    // Priority Queue (min-heap simulation with sorted array)
    let pq = [];

    this.nodes.forEach(n => {
      distances[n.id] = n.id === startId ? 0 : Infinity;
    });

    pq.push({ node: startId, dist: 0 });

    while (pq.length > 0) {
      // Sort to get minimum (simple PQ — efficient enough for campus scale)
      pq.sort((a, b) => a.dist - b.dist);
      const { node: curr, dist: currDist } = pq.shift();

      if (visited.has(curr)) continue;
      visited.add(curr);

      if (curr === endId) break;

      const neighbors = this.adjacencyList[curr] || [];
      for (const neighbor of neighbors) {
        if (visited.has(neighbor.node)) continue;
        const newDist = currDist + neighbor.weight;
        if (newDist < distances[neighbor.node]) {
          distances[neighbor.node] = newDist;
          prev[neighbor.node] = { from: curr, description: neighbor.description, baseDistance: neighbor.baseDistance };
          pq.push({ node: neighbor.node, dist: newDist });
        }
      }
    }

    if (distances[endId] === Infinity) {
      return { error: 'No path found between these locations' };
    }

    // Reconstruct path
    const path = [];
    const steps = [];
    let current = endId;
    while (current && current !== startId) {
      const p = prev[current];
      path.unshift(current);
      steps.unshift({ from: p.from, to: current, description: p.description, distance: p.baseDistance });
      current = p.from;
    }
    path.unshift(startId);

    // Detect if rerouting happened (any node in path has High crowd)
    const rerouted = path.some(nodeId => this.crowdMap[nodeId]?.level === 'High');

    const trueDistance = steps.reduce((sum, step) => sum + step.distance, 0);
    const estimatedTime = Math.ceil(trueDistance / 80); // Assuming 80m per minute walking speed

    return {
      path,
      steps,
      totalDistance: Math.round(distances[endId]),
      trueDistance,
      estimatedTime,
      rerouted,
      crowdWarnings: path
        .filter(n => this.crowdMap[n]?.level !== 'Low')
        .map(n => ({ nodeId: n, level: this.crowdMap[n]?.level }))
    };
  }
}

module.exports = NavigationEngine;
