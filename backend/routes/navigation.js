const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getAllLocations, getAllEdges } = require('../models/Location');
const { getAllCrowdData } = require('../models/CrowdData');
const NavigationEngine = require('../services/NavigationEngine');

// GET /api/navigation/shortest-path?from=N1&to=N15
router.get('/shortest-path', authenticateToken, (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from and to query params required' });

    const nodes     = getAllLocations();
    const edges     = getAllEdges();
    const crowdData = getAllCrowdData();

    const engine = new NavigationEngine(nodes, edges, crowdData);
    const result = engine.findShortestPath(from, to);

    if (result.error) return res.status(404).json({ error: result.error });

    // Enrich path with full node details
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    const enrichedPath = result.path.map(id => nodeMap[id]);

    res.json({ ...result, pathDetails: enrichedPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
