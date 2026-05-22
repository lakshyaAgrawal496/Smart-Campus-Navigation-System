const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getAllLocations, getLocationById, searchLocations, createLocation, updateLocation, deleteLocation, getAllEdges } = require('../models/Location');

// GET /api/locations — all locations (authenticated users)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search } = req.query;
    const locations = search ? searchLocations(search) : getAllLocations();
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations/edges/all
router.get('/edges/all', authenticateToken, (req, res) => {
  try {
    res.json(getAllEdges());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations/:id
router.get('/:id', authenticateToken, (req, res) => {
  const loc = getLocationById(req.params.id);
  if (!loc) return res.status(404).json({ error: 'Location not found' });
  res.json(loc);
});

// POST /api/locations — ADMIN only
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id, name, floor, x, y, type, description, connectedNodeId, edgeDistance } = req.body;
    if (!id || !name || !floor || x == null || y == null || !type) {
      return res.status(400).json({ error: 'id, name, floor, x, y, type are required' });
    }
    if (getLocationById(id)) return res.status(409).json({ error: 'Location ID already exists' });
    const loc = createLocation({ id, name, floor: String(floor), x: Number(x), y: Number(y), type, description: description || '', connectedNodeId, edgeDistance });
    res.status(201).json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/locations/:id — ADMIN only
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const loc = getLocationById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    const { name, floor, x, y, type, description } = req.body;
    const updated = updateLocation(req.params.id, {
      name: name || loc.name,
      floor: floor !== undefined ? String(floor) : loc.floor,
      x: x != null ? Number(x) : loc.x,
      y: y != null ? Number(y) : loc.y,
      type: type || loc.type,
      description: description !== undefined ? description : loc.description
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/locations/:id — ADMIN only
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const loc = getLocationById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    deleteLocation(req.params.id);
    res.json({ message: `Location ${req.params.id} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
