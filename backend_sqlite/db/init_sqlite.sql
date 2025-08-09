-- Simplified SQLite schema adapted from the project's Supabase/Postgres migrations.
-- ENUM types converted to TEXT. RECORD types converted to JSON (TEXT).
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS tree_species (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_seedling TEXT,
  image_sprout TEXT,
  image_sapling TEXT
);

CREATE TABLE IF NOT EXISTS trees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner TEXT,
  species_id INTEGER REFERENCES tree_species(id),
  growth_stage TEXT, -- formerly enum
  water_level INTEGER DEFAULT 0,
  feed_level INTEGER DEFAULT 0,
  love_points INTEGER DEFAULT 0,
  metadata TEXT -- JSON blob for any additional data
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  metadata TEXT
);

-- Simple example seeds
INSERT OR IGNORE INTO tree_species (id, name, description) VALUES (1,'Oak','Sturdy oak tree');
INSERT OR IGNORE INTO tree_species (id, name, description) VALUES (2,'Pine','Evergreen pine');

COMMIT;


CREATE TABLE IF NOT EXISTS care_parameters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id INTEGER REFERENCES tree_species(id),
  param_name TEXT,
  param_value TEXT
);

CREATE TABLE IF NOT EXISTS care_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tree_id INTEGER REFERENCES trees(id),
  action TEXT,
  actor TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS tree_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tree_id INTEGER REFERENCES trees(id),
  event_type TEXT,
  description TEXT,
  created_at INTEGER DEFAULT (strftime('%s','now')),
  metadata TEXT
);

-- users table updated to include password_hash
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user',
  metadata TEXT
);

-- ensure seeds exist
INSERT OR IGNORE INTO tree_species (id, name, description) VALUES (1,'Oak','Sturdy oak tree');
INSERT OR IGNORE INTO tree_species (id, name, description) VALUES (2,'Pine','Evergreen pine');
