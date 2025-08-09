const db = require('./database');

// Drop existing tables
db.exec(`
  DROP TABLE IF EXISTS trees;
  DROP TABLE IF EXISTS watering_events;
`);

// Create tables
db.exec(`
  CREATE TABLE trees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    species TEXT NOT NULL,
    location TEXT NOT NULL,
    planted_date DATE NOT NULL,
    last_watered DATE,
    health_status TEXT DEFAULT 'Good',
    notes TEXT
  );

  CREATE TABLE watering_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tree_id INTEGER NOT NULL,
    watering_date DATE NOT NULL,
    amount_liters REAL NOT NULL,
    notes TEXT,
    FOREIGN KEY (tree_id) REFERENCES trees(id)
  );
`);

console.log('Database schema created successfully!');
