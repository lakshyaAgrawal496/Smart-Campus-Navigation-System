const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getAllCrowdData, getCrowdByNode, updateCrowd } = require('../models/CrowdData');
const { getLocationById } = require('../models/Location');

// GET /api/crowd — all crowd data
router.get('/', authenticateToken, (req, res) => {
  try {
    res.json(getAllCrowdData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crowd/:nodeId
router.get('/:nodeId', authenticateToken, (req, res) => {
  const data = getCrowdByNode(req.params.nodeId);
  if (!data) return res.status(404).json({ error: 'No crowd data for this node' });
  res.json(data);
});

// PUT /api/crowd/:nodeId — ADMIN only
router.put('/:nodeId', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { level } = req.body;
    if (!['Low', 'Medium', 'High'].includes(level)) {
      return res.status(400).json({ error: 'level must be Low, Medium, or High' });
    }
    if (!getLocationById(req.params.nodeId)) {
      return res.status(404).json({ error: 'Location not found' });
    }
    const updated = updateCrowd(req.params.nodeId, level);
    res.json({ message: 'Crowd data updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
