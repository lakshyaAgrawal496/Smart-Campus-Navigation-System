const { getDb } = require('./database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  const db = getDb();

  // Check if already seeded
  const existing = db.prepare('SELECT COUNT(*) as count FROM locations').get();
  if (existing.count > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database...');

  // ─── NODES (25 campus locations) ───────────────────────────────────────────
  const nodes = [
    // Floor 0 – Ground Floor
    { id: 'N1',  name: 'Main Entrance',       floor: '0', x: 80,  y: 480, type: 'facility',   description: 'Primary campus entrance gate' },
    { id: 'N2',  name: 'Security Gate',        floor: '0', x: 80,  y: 380, type: 'facility',   description: 'Security check point' },
    { id: 'N3',  name: 'Reception / Lobby',    floor: '0', x: 220, y: 380, type: 'facility',   description: 'Main reception and information desk' },
    { id: 'N4',  name: 'Parking Area',         floor: '0', x: 80,  y: 560, type: 'parking',    description: 'Student and faculty parking' },
    { id: 'N5',  name: 'Cafeteria',            floor: '0', x: 380, y: 480, type: 'cafeteria',  description: 'Main campus cafeteria' },
    { id: 'N6',  name: 'Medical Room',         floor: '0', x: 380, y: 380, type: 'medical',    description: 'Campus health centre' },
    { id: 'N7',  name: 'Director\'s Office',   floor: '0', x: 540, y: 380, type: 'office',     description: 'Director and administrative office' },
    { id: 'N8',  name: 'Library',              floor: '0', x: 540, y: 480, type: 'library',    description: 'Central campus library' },
    { id: 'N9',  name: 'Staircase A',          floor: 'multi', x: 310, y: 300, type: 'stairs', description: 'Main staircase block A' },
    { id: 'N10', name: 'Staircase B',          floor: 'multi', x: 460, y: 300, type: 'stairs', description: 'Secondary staircase block B' },
    // Floor 1
    { id: 'N11', name: 'Classroom 101',        floor: '1', x: 180, y: 200, type: 'classroom',  description: 'Lecture hall – Floor 1' },
    { id: 'N12', name: 'Classroom 102',        floor: '1', x: 290, y: 200, type: 'classroom',  description: 'Lecture hall – Floor 1' },
    { id: 'N13', name: 'Classroom 103',        floor: '1', x: 400, y: 200, type: 'classroom',  description: 'Lecture hall – Floor 1' },
    { id: 'N14', name: 'Classroom 104',        floor: '1', x: 510, y: 200, type: 'classroom',  description: 'Lecture hall – Floor 1' },
    { id: 'N15', name: 'CSE Lab',              floor: '1', x: 600, y: 200, type: 'laboratory', description: 'Computer Science Engineering Lab' },
    { id: 'N16', name: 'Electronics Lab',      floor: '1', x: 600, y: 290, type: 'laboratory', description: 'Electronics & Communication Lab' },
    { id: 'N17', name: 'Faculty Room – Block A', floor: '1', x: 180, y: 290, type: 'office',   description: 'Faculty cabins – Block A' },
    { id: 'N18', name: 'Staircase A – F1',     floor: 'multi', x: 310, y: 260, type: 'stairs', description: 'Staircase A landing – Floor 1' },
    { id: 'N19', name: 'Staircase B – F1',     floor: 'multi', x: 460, y: 260, type: 'stairs', description: 'Staircase B landing – Floor 1' },
    // Floor 2
    { id: 'N20', name: 'Classroom 201',        floor: '2', x: 180, y: 120, type: 'classroom',  description: 'Lecture hall – Floor 2' },
    { id: 'N21', name: 'Classroom 202',        floor: '2', x: 290, y: 120, type: 'classroom',  description: 'Lecture hall – Floor 2' },
    { id: 'N22', name: 'Classroom 203',        floor: '2', x: 400, y: 120, type: 'classroom',  description: 'Lecture hall – Floor 2' },
    { id: 'N23', name: 'Physics Lab',          floor: '2', x: 600, y: 120, type: 'laboratory', description: 'Physics research laboratory' },
    { id: 'N24', name: 'Staircase A – F2',     floor: 'multi', x: 310, y: 160, type: 'stairs', description: 'Staircase A landing – Floor 2' },
    { id: 'N25', name: 'Faculty Room – Block B', floor: '2', x: 510, y: 120, type: 'office',   description: 'Faculty cabins – Block B' },
  ];

  const insertNode = db.prepare(`
    INSERT OR IGNORE INTO locations (id, name, floor, x, y, type, description)
    VALUES (@id, @name, @floor, @x, @y, @type, @description)
  `);
  const insertManyNodes = db.transaction((nodes) => nodes.forEach(n => insertNode.run(n)));
  insertManyNodes(nodes);

  // ─── EDGES ─────────────────────────────────────────────────────────────────
  const edges = [
    // Ground floor connections
    { source: 'N1',  target: 'N2',  distance: 12,  description: 'Entrance to security' },
    { source: 'N1',  target: 'N4',  distance: 10,  description: 'Entrance to parking' },
    { source: 'N2',  target: 'N3',  distance: 18,  description: 'Security to reception' },
    { source: 'N3',  target: 'N5',  distance: 22,  description: 'Reception to cafeteria' },
    { source: 'N3',  target: 'N6',  distance: 20,  description: 'Reception to medical' },
    { source: 'N3',  target: 'N9',  distance: 15,  description: 'Reception to Staircase A' },
    { source: 'N5',  target: 'N8',  distance: 18,  description: 'Cafeteria to library' },
    { source: 'N6',  target: 'N7',  distance: 16,  description: 'Medical to director office' },
    { source: 'N6',  target: 'N10', distance: 18,  description: 'Medical to Staircase B' },
    { source: 'N7',  target: 'N8',  distance: 12,  description: 'Director office to library' },
    { source: 'N8',  target: 'N10', distance: 14,  description: 'Library to Staircase B' },
    { source: 'N9',  target: 'N10', distance: 20,  description: 'Staircase A to B (ground)' },
    // Ground ↔ Floor 1 (via stairs)
    { source: 'N9',  target: 'N18', distance: 15,  description: 'Staircase A: Ground to Floor 1' },
    { source: 'N10', target: 'N19', distance: 15,  description: 'Staircase B: Ground to Floor 1' },
    // Floor 1 connections
    { source: 'N18', target: 'N11', distance: 14,  description: 'Staircase A to Class 101' },
    { source: 'N18', target: 'N12', distance: 10,  description: 'Staircase A to Class 102' },
    { source: 'N18', target: 'N17', distance: 16,  description: 'Staircase A to Faculty Room A' },
    { source: 'N11', target: 'N12', distance: 12,  description: 'Class 101 to 102' },
    { source: 'N11', target: 'N17', distance: 10,  description: 'Class 101 to Faculty Room A' },
    { source: 'N12', target: 'N13', distance: 12,  description: 'Class 102 to 103' },
    { source: 'N13', target: 'N14', distance: 12,  description: 'Class 103 to 104' },
    { source: 'N13', target: 'N19', distance: 16,  description: 'Class 103 to Staircase B' },
    { source: 'N14', target: 'N15', distance: 10,  description: 'Class 104 to CSE Lab' },
    { source: 'N15', target: 'N16', distance: 10,  description: 'CSE Lab to Electronics Lab' },
    { source: 'N16', target: 'N19', distance: 18,  description: 'Electronics Lab to Staircase B' },
    { source: 'N18', target: 'N19', distance: 20,  description: 'Floor 1: Staircase A to B' },
    // Floor 1 ↔ Floor 2 (via stairs)
    { source: 'N18', target: 'N24', distance: 15,  description: 'Staircase A: Floor 1 to Floor 2' },
    // Floor 2 connections
    { source: 'N24', target: 'N20', distance: 14,  description: 'Staircase A to Class 201' },
    { source: 'N24', target: 'N21', distance: 10,  description: 'Staircase A to Class 202' },
    { source: 'N20', target: 'N21', distance: 12,  description: 'Class 201 to 202' },
    { source: 'N21', target: 'N22', distance: 12,  description: 'Class 202 to 203' },
    { source: 'N22', target: 'N25', distance: 12,  description: 'Class 203 to Faculty Room B' },
    { source: 'N25', target: 'N23', distance: 10,  description: 'Faculty Room B to Physics Lab' },
  ];

  const insertEdge = db.prepare(`
    INSERT OR IGNORE INTO edges (source, target, distance, description)
    VALUES (@source, @target, @distance, @description)
  `);
  const insertManyEdges = db.transaction((edges) => edges.forEach(e => insertEdge.run(e)));
  insertManyEdges(edges);

  // ─── CROWD DATA (default Low for all) ──────────────────────────────────────
  const insertCrowd = db.prepare(`
    INSERT OR IGNORE INTO crowd_data (node_id, level, multiplier, last_updated)
    VALUES (@node_id, @level, @multiplier, @last_updated)
  `);
  const insertManyCrowd = db.transaction((nodes) => nodes.forEach(n =>
    insertCrowd.run({ node_id: n.id, level: 'Low', multiplier: 1.0, last_updated: new Date().toISOString() })
  ));
  insertManyCrowd(nodes);

  // ─── DEFAULT USERS ─────────────────────────────────────────────────────────
  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash  = bcrypt.hashSync('user123', 10);

  db.prepare(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?,?,?)`).run('admin', adminHash, 'ADMIN');
  db.prepare(`INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (?,?,?)`).run('student', userHash, 'USER');

  console.log(' Seeding complete! Default accounts: admin/admin123 | student/user123');
}

module.exports = { seedDatabase };
