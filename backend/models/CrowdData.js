const { getDb } = require('../db/database');

function getAllCrowdData() {
  return getDb().prepare(`
    SELECT c.*, l.name, l.floor, l.x, l.y, l.type
    FROM crowd_data c JOIN locations l ON c.node_id = l.id
    ORDER BY l.floor, c.node_id
  `).all();
}

function getCrowdByNode(nodeId) {
  return getDb().prepare('SELECT * FROM crowd_data WHERE node_id = ?').get(nodeId);
}

function updateCrowd(nodeId, level) {
  const multiplierMap = { Low: 1.0, Medium: 2.5, High: 5.0 };
  const multiplier = multiplierMap[level] || 1.0;
  getDb().prepare(`
    UPDATE crowd_data SET level = ?, multiplier = ?, last_updated = datetime('now')
    WHERE node_id = ?
  `).run(level, multiplier, nodeId);
  return getCrowdByNode(nodeId);
}

module.exports = { getAllCrowdData, getCrowdByNode, updateCrowd };
