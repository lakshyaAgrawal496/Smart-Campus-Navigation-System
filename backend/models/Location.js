const { getDb } = require('../db/database');

function getAllLocations() {
  return getDb().prepare('SELECT * FROM locations ORDER BY floor, id').all();
}

function getLocationById(id) {
  return getDb().prepare('SELECT * FROM locations WHERE id = ?').get(id);
}

function searchLocations(query) {
  return getDb().prepare(`
    SELECT * FROM locations WHERE name LIKE ? OR type LIKE ? OR description LIKE ?
  `).all(`%${query}%`, `%${query}%`, `%${query}%`);
}

function createLocation(loc) {
  const db = getDb();
  const insertTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO locations (id, name, floor, x, y, type, description)
      VALUES (@id, @name, @floor, @x, @y, @type, @description)
    `).run(loc);
    // Init crowd data for new node
    db.prepare(`
      INSERT OR IGNORE INTO crowd_data (node_id, level, multiplier, last_updated)
      VALUES (?, 'Low', 1.0, datetime('now'))
    `).run(loc.id);

    // Create edge if connectedNodeId is provided
    if (loc.connectedNodeId && loc.edgeDistance) {
      db.prepare(`
        INSERT INTO edges (source, target, distance, description)
        VALUES (?, ?, ?, ?)
      `).run(loc.id, loc.connectedNodeId, loc.edgeDistance, `Connection to ${loc.connectedNodeId}`);
    }
  });

  insertTx();
  return getLocationById(loc.id);
}

function updateLocation(id, loc) {
  getDb().prepare(`
    UPDATE locations SET name=@name, floor=@floor, x=@x, y=@y, type=@type, description=@description
    WHERE id=@id
  `).run({ ...loc, id });
  return getLocationById(id);
}

function deleteLocation(id) {
  return getDb().prepare('DELETE FROM locations WHERE id = ?').run(id);
}

function getAllEdges() {
  return getDb().prepare('SELECT * FROM edges').all();
}

module.exports = { getAllLocations, getLocationById, searchLocations, createLocation, updateLocation, deleteLocation, getAllEdges };
