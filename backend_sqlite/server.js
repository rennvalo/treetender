// Load random events
const randomEvents = require('./db/random_events.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const DB_PATH = path.join(__dirname, 'data', 'app.db');
const INIT_SQL = path.join(__dirname, 'db', 'init_sqlite.sql');

fs.mkdirSync(path.join(__dirname,'data'), { recursive: true });

if (!fs.existsSync(DB_PATH)) {
  console.log('Initializing SQLite database...');
  const initSql = fs.readFileSync(INIT_SQL, 'utf8');
  const tmpdb = new sqlite3.Database(DB_PATH);
  tmpdb.exec(initSql, (err) => {
    if (err) {
      console.error('Error initializing DB:', err);
      process.exit(1);
    } else {
      console.log('SQLite DB initialized.');
      tmpdb.close();
    }
  });
}

const db = new sqlite3.Database(DB_PATH);
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS for local dev - adjust in production
app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Ensure runtime schema compatibility (idempotent)
async function ensureSchema() {
  try {
    const cols = await allAsync("PRAGMA table_info(tree_species)");
    const hasFull = Array.isArray(cols) && cols.some(c => c.name === 'image_full_tree');
    if (!hasFull) {
      await runAsync('ALTER TABLE tree_species ADD COLUMN image_full_tree TEXT');
      console.log('Added image_full_tree column to tree_species');
    }
  } catch (e) {
    console.warn('Schema check failed:', e.message);
  }
}
ensureSchema();

// Helper to run queries returning Promise
function allAsync(sql, params=[]) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}
function getAsync(sql, params=[]) {
  return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
}
function runAsync(sql, params=[]) {
  return new Promise((resolve, reject) => db.run(sql, params, function(err) { err ? reject(err) : resolve(this); }));
}

// Auth endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, display_name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    const existing = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'user exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const info = await runAsync(
      'INSERT INTO users (email, password_hash, display_name, role) VALUES (?,?,?,?)',
      [email, hash, display_name || null, 'user']
    );

    const user = await getAsync(
      'SELECT id, email, display_name, role FROM users WHERE id = ?',
      [info.lastID]
    );

    // 🌳 Create a starter tree for the new user, now correctly linked
    // 1. Find the ID for the default 'Oak' species.
    const defaultSpecies = await getAsync(`SELECT id FROM tree_species WHERE name = ?`, ['Oak']);
    if (!defaultSpecies) {
      console.error("Default 'Oak' species not found in tree_species table!");
      return res.status(500).json({ error: 'Server configuration error: Default species not found.' });
    }
    const speciesId = defaultSpecies.id;
    // Initialize metadata to carry game state
    const initMeta = JSON.stringify({
      user_id: user.id,
      last_user_activity: Date.now(),
      last_evaluation: Date.now(),
      growth_points: 0,
      targets: {
        water: Math.floor(Math.random()*15)+1,
        sunlight: Math.floor(Math.random()*15)+1,
        feed: Math.floor(Math.random()*15)+1,
        love: Math.floor(Math.random()*15)+1,
      },
      health: 'healthy'
    });

    await runAsync(
      `INSERT INTO trees (owner, species_id, growth_stage, metadata)
       VALUES (?, ?, ?, ?)`,
      [email, speciesId, 'seedling', initMeta]
    );

    // 🌿 Fetch the newly created tree to return
    const newTree = await getAsync(
      `SELECT * FROM trees WHERE owner = ? ORDER BY id DESC LIMIT 1`,
      [email]
    );

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '30d' }
    );

    res.json({ user, access_token: token, starter_tree: newTree });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ error: 'invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash || '');
    if (!match) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '30d' });
    res.json({ user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role }, access_token: token });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Middleware to protect routes
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// CRUD endpoints for tables
const tables = ['tree_species','trees','care_parameters','care_logs','tree_events','users'];

tables.forEach(t => {
  app.get(`/api/${t}`, async (req,res)=>{
    try {
      const rows = await allAsync(`SELECT * FROM ${t}`);
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post(`/api/${t}`, async (req,res)=>{
    try {
      const keys = Object.keys(req.body || {});
      if (keys.length === 0) return res.status(400).json({ error: 'no data' });
      const cols = keys.join(',');
      const qs = keys.map(_=>'?').join(',');
      const vals = keys.map(k=> (typeof req.body[k] === 'object' ? JSON.stringify(req.body[k]) : req.body[k]));
      const info = await runAsync(`INSERT INTO ${t} (${cols}) VALUES (${qs})`, vals);
      const row = await getAsync(`SELECT * FROM ${t} WHERE id = ?`, [info.lastID]);
      res.json(row);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

async function evaluateAllTrees(reason = 'manual') {
  const now = Date.now();
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  const trees = await allAsync('SELECT t.*, ts.name as species_name FROM trees t LEFT JOIN tree_species ts ON t.species_id = ts.id');
  for (const tree of trees) {
    let meta = {};
    try { meta = JSON.parse(tree.metadata || '{}'); } catch {}
    const targets = meta.targets || {
      water: Math.floor(Math.random()*15)+1,
      sunlight: Math.floor(Math.random()*15)+1,
      feed: Math.floor(Math.random()*15)+1,
      love: Math.floor(Math.random()*15)+1,
    };
    const lastEval = meta.last_evaluation || (now - twelveHoursMs - 1000);
    const lastAct = meta.last_user_activity || now;

    const careCounts = await getAsync(`SELECT 
      COALESCE(SUM(CASE WHEN action='water' THEN 1 ELSE 0 END),0) as water_count,
      COALESCE(SUM(CASE WHEN action='feed' THEN 1 ELSE 0 END),0) as feed_count,
      COALESCE(SUM(CASE WHEN action='sunlight' THEN 1 ELSE 0 END),0) as sunlight_count,
      COALESCE(SUM(CASE WHEN action='love' THEN 1 ELSE 0 END),0) as love_count
      FROM care_logs WHERE tree_id = ? AND created_at >= ?`, [tree.id, Math.floor(lastEval/1000)]);
    const w = careCounts.water_count || 0;
    const s = careCounts.sunlight_count || 0;
    const f = careCounts.feed_count || 0;
    const l = careCounts.love_count || 0;

    let earned = 0;
    earned += (w === targets.water ? 25 : w);
    earned += (s === targets.sunlight ? 25 : s);
    earned += (f === targets.feed ? 25 : f);
    earned += (l === targets.love ? 25 : l);

    // inactivity penalty: 5 per 12h inactive, capped at current points
    let points = meta.growth_points || 0;
    const hoursInactive = Math.floor((now - lastAct) / (60*60*1000));
    let penalty = 0;
    if (hoursInactive > 12) penalty = Math.min(Math.floor(hoursInactive/12)*5, points);
    points = Math.max(0, points - penalty + earned);

    // stage advancement
    let stage = tree.growth_stage || 'seedling';
    const order = ['seedling','sprout','sapling','full_tree'];
    if (points >= 100) {
      const idx = Math.max(0, order.indexOf(stage));
      stage = order[Math.min(order.length-1, idx+1)];
      points = points - 100;
    }

    // set new targets for next round
    const newTargets = {
      water: Math.floor(Math.random()*15)+1,
      sunlight: Math.floor(Math.random()*15)+1,
      feed: Math.floor(Math.random()*15)+1,
      love: Math.floor(Math.random()*15)+1,
    };

    const newMeta = { ...meta, growth_points: points, last_evaluation: now, targets: newTargets };
    await runAsync('UPDATE trees SET growth_stage = ?, metadata = ? WHERE id = ?', [stage, JSON.stringify(newMeta), tree.id]);
    // record simple evaluation event for history
    await runAsync('INSERT INTO tree_events (tree_id, event_type, description, created_at) VALUES (?,?,?, strftime("%s","now"))', [tree.id, 'evaluation', `Round evaluated (${reason}). +${earned} pts, -${penalty} penalty.`]);
  }
  return trees.length;
}

// Evaluation endpoint - uses shared function
app.post('/api/evaluate', authMiddleware, async (req, res) => {
  try {
    const processed = await evaluateAllTrees('manual');
    res.json({ ok: true, processed });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Return current user's tree (joined with species)
app.get('/api/my-tree', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    let tree = await getAsync('SELECT * FROM trees WHERE owner = ? ORDER BY id DESC LIMIT 1', [email]);
    if (!tree) return res.status(404).json({ error: 'No tree found for user' });
    const species = await getAsync('SELECT * FROM tree_species WHERE id = ?', [tree.species_id]);
    let meta = {};
    try { meta = JSON.parse(tree.metadata || '{}'); } catch {}
    const targets = meta.targets || {};
    const mapped = {
      ...tree,
      growth_points: meta.growth_points ?? 0,
      last_evaluation: meta.last_evaluation ? new Date(meta.last_evaluation).toISOString() : null,
      last_user_activity: meta.last_user_activity ? new Date(meta.last_user_activity).toISOString() : null,
      target_water: targets.water ?? null,
      target_sunlight: targets.sunlight ?? null,
      target_feed: targets.feed ?? null,
      target_love: targets.love ?? null,
      health: meta.health || 'healthy',
      tree_species: species || null,
    };
    res.json(mapped);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Record a care action for current user tree
app.post('/api/care', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub;
    const email = req.user.email;
    const { tree_id, action } = req.body || {};
    if (!action) return res.status(400).json({ error: 'action required' });
    let tree = tree_id ? await getAsync('SELECT * FROM trees WHERE id = ?', [tree_id]) : null;
    if (!tree) {
      tree = await getAsync('SELECT * FROM trees WHERE owner = ? ORDER BY id DESC LIMIT 1', [email]);
    }
    if (!tree) return res.status(404).json({ error: 'tree not found' });
    await runAsync('INSERT INTO care_logs (tree_id, action, actor, created_at) VALUES (?,?,?, strftime("%s","now"))', [tree.id, action, String(userId)]);
    // bump last activity in metadata
    const current = await getAsync('SELECT metadata FROM trees WHERE id = ?', [tree.id]);
    let meta = {};
    try { meta = JSON.parse(current?.metadata || '{}'); } catch {}
    meta.last_user_activity = Date.now();
    await runAsync('UPDATE trees SET metadata = ? WHERE id = ?', [JSON.stringify(meta), tree.id]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Update last user activity on tree
app.post('/api/user-activity', authMiddleware, async (req, res) => {
  try {
  const email = req.user.email;
  const tree = await getAsync('SELECT id, metadata FROM trees WHERE owner = ? ORDER BY id DESC LIMIT 1', [email]);
  if (!tree) return res.json({ ok: true });
  let meta = {};
  try { meta = JSON.parse(tree.metadata || '{}'); } catch {}
  meta.last_user_activity = Date.now();
  await runAsync('UPDATE trees SET metadata = ? WHERE id = ?', [JSON.stringify(meta), tree.id]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Get current/latest event for a tree
app.get('/api/current-event', authMiddleware, async (req, res) => {
  try {
    const treeId = Number(req.query.tree_id);
    if (!treeId) return res.status(400).json({ error: 'tree_id required' });
    const ev = await getAsync('SELECT * FROM tree_events WHERE tree_id = ? ORDER BY created_at DESC LIMIT 1', [treeId]);
    if (ev && ev.metadata) {
      try {
        ev.random_event = JSON.parse(ev.metadata);
      } catch {}
    }
    res.json(ev || null);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Get recent events for a tree
app.get('/api/tree-events', authMiddleware, async (req, res) => {
  try {
    const treeId = Number(req.query.tree_id);
    const limit = Number(req.query.limit) || 10;
    if (!treeId) return res.status(400).json({ error: 'tree_id required' });
    const rows = await allAsync('SELECT * FROM tree_events WHERE tree_id = ? ORDER BY created_at DESC LIMIT ?', [treeId, limit]);
    for (const ev of rows) {
      if (ev && ev.metadata) {
        try {
          ev.random_event = JSON.parse(ev.metadata);
        } catch {}
      }
    }
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Compute current round progress (since last_evaluation)
app.get('/api/round-progress', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const qTreeId = req.query.tree_id ? Number(req.query.tree_id) : undefined;
    let tree = qTreeId ? await getAsync('SELECT * FROM trees WHERE id = ?', [qTreeId]) : null;
    if (!tree) tree = await getAsync('SELECT * FROM trees WHERE owner = ? ORDER BY id DESC LIMIT 1', [email]);
    if (!tree) return res.status(404).json({ error: 'tree not found' });
    let meta = {};
    try { meta = JSON.parse(tree.metadata || '{}'); } catch {}
    const targets = meta.targets || {};
    const lastEvalMs = meta.last_evaluation || 0;
    const since = Math.floor((lastEvalMs || 0) / 1000);
    const counts = await getAsync(`SELECT 
      COALESCE(SUM(CASE WHEN action='water' THEN 1 ELSE 0 END),0) as water,
      COALESCE(SUM(CASE WHEN action='sunlight' THEN 1 ELSE 0 END),0) as sunlight,
      COALESCE(SUM(CASE WHEN action='feed' THEN 1 ELSE 0 END),0) as feed,
      COALESCE(SUM(CASE WHEN action='love' THEN 1 ELSE 0 END),0) as love
      FROM care_logs WHERE tree_id = ? AND created_at >= ?`, [tree.id, since]);
    const earned =
      (counts.water === (targets.water ?? -1) ? 25 : counts.water) +
      (counts.sunlight === (targets.sunlight ?? -1) ? 25 : counts.sunlight) +
      (counts.feed === (targets.feed ?? -1) ? 25 : counts.feed) +
      (counts.love === (targets.love ?? -1) ? 25 : counts.love);
    res.json({ tree_id: tree.id, counts, targets, potential_points: earned, last_evaluation: lastEvalMs || null });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Admin-esque endpoints for species care parameters
// GET parameters for a species aggregated into an object
app.get('/api/species/:id/params', authMiddleware, async (req, res) => {
  try {
    const speciesId = Number(req.params.id);
    if (!speciesId) return res.status(400).json({ error: 'invalid species id' });
    const rows = await allAsync('SELECT param_name, param_value FROM care_parameters WHERE species_id = ?', [speciesId]);
    const params = rows.reduce((acc, r) => {
      acc[r.param_name] = isFinite(Number(r.param_value)) ? Number(r.param_value) : r.param_value;
      return acc;
    }, {});
    // Ensure all expected keys exist with defaults
    const defaults = { min_water: 1, max_water: 15, min_sunlight: 1, max_sunlight: 15, min_feed: 1, max_feed: 15, min_love: 1, max_love: 15 };
    res.json({ ...defaults, ...params });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// PUT parameters for a species (upsert rows)
app.put('/api/species/:id/params', authMiddleware, async (req, res) => {
  try {
    const speciesId = Number(req.params.id);
    const body = req.body || {};
    if (!speciesId) return res.status(400).json({ error: 'invalid species id' });

    const keys = ['min_water','max_water','min_sunlight','max_sunlight','min_feed','max_feed','min_love','max_love'];
    for (const k of keys) {
      if (body[k] === undefined) continue;
      const exists = await getAsync('SELECT id FROM care_parameters WHERE species_id = ? AND param_name = ?', [speciesId, k]);
      if (exists) {
        await runAsync('UPDATE care_parameters SET param_value = ? WHERE id = ?', [String(body[k]), exists.id]);
      } else {
        await runAsync('INSERT INTO care_parameters (species_id, param_name, param_value) VALUES (?,?,?)', [speciesId, k, String(body[k])]);
      }
    }
    const rows = await allAsync('SELECT param_name, param_value FROM care_parameters WHERE species_id = ?', [speciesId]);
    const params = rows.reduce((acc, r) => { acc[r.param_name] = isFinite(Number(r.param_value)) ? Number(r.param_value) : r.param_value; return acc; }, {});
    res.json(params);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Admin: get/update care parameters for a species
app.get('/api/care-parameters/:speciesId', authMiddleware, async (req, res) => {
  try {
    const speciesId = Number(req.params.speciesId);
    const rows = await allAsync('SELECT * FROM care_parameters WHERE species_id = ?', [speciesId]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.put('/api/care-parameters/:speciesId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const speciesId = Number(req.params.speciesId);
    const params = req.body && Array.isArray(req.body) ? req.body : [];
    // naive replace strategy: delete then insert
    await runAsync('DELETE FROM care_parameters WHERE species_id = ?', [speciesId]);
    for (const p of params) {
      await runAsync('INSERT INTO care_parameters (species_id, param_name, param_value) VALUES (?,?,?)', [speciesId, p.param_name, String(p.param_value)]);
    }
    const rows = await allAsync('SELECT * FROM care_parameters WHERE species_id = ?', [speciesId]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// health and static serving
app.get('/health', (req,res) => res.json({ok:true}));
const staticPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Frontend not built. In development mode run the frontend dev server or build into /dist.');
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Auto-evaluate every 5 minutes to persist points/stages and trigger random events
const FIVE_MINUTES_MS = 5 * 60 * 1000;
setInterval(async () => {
  try {
    const n = await evaluateAllTrees('auto');
    // After evaluation, trigger a random event for each tree
    const treeRows = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM trees', (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
    for (const tree of treeRows) {
      const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      // Get current growth points
      const treeRow = await new Promise((resolve, reject) => {
        db.get('SELECT metadata FROM trees WHERE id = ?', [tree.id], (err, row) => {
          if (err) reject(err); else resolve(row);
        });
      });
      let meta = {};
      try { meta = JSON.parse(treeRow.metadata || '{}'); } catch {}
      let points = meta.growth_points || 0;
      let pointChange = 0;
  if (event.health_impact === 'positive') pointChange = 5;
  if (event.health_impact === 'negative') pointChange = -5;
  if (event.health_impact === 'neutral') pointChange = 0;
      points = Math.max(0, points + pointChange);
      meta.growth_points = points;
      // Update tree points
      await new Promise((resolve, reject) => {
        db.run('UPDATE trees SET metadata = ? WHERE id = ?', [JSON.stringify(meta), tree.id], (err) => {
          if (err) reject(err); else resolve();
        });
      });
      // Insert event with point change in description
      const desc = `${event.description} ${pointChange >= 0 ? '+' : ''}${pointChange} points.`;
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO tree_events (tree_id, event_type, description, created_at, metadata) VALUES (?,?,?,?,?)',
          [
            tree.id,
            event.name,
            desc,
            Math.floor(Date.now()/1000),
            JSON.stringify({
              emoji: event.emoji,
              health_impact: event.health_impact,
              water_modifier: event.water_modifier || 0,
              sunlight_modifier: event.sunlight_modifier || 0,
              feed_modifier: event.feed_modifier || 0,
              love_modifier: event.love_modifier || 0,
              point_change: pointChange
            })
          ],
          (err) => { if (err) reject(err); else resolve(); }
        );
      });
    }
    console.log(`[auto-evaluate] processed ${n} trees and triggered random events at ${new Date().toISOString()}`);
  } catch (e) {
    console.warn('[auto-evaluate] failed:', e.message);
  }
}, FIVE_MINUTES_MS);