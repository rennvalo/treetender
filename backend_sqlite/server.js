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
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const existing = await getAsync('SELECT * FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'user exists' });
    const hash = await bcrypt.hash(password, 10);
    const info = await runAsync('INSERT INTO users (email, password_hash, display_name, role) VALUES (?,?,?,?)', [email, hash, display_name || null, 'user']);
    const user = await getAsync('SELECT id, email, display_name, role FROM users WHERE id = ?', [info.lastID]);
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '30d' });
    res.json({ user, access_token: token });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
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

// Evaluation endpoint - simplified port of Postgres function
app.post('/api/evaluate', authMiddleware, async (req, res) => {
  try {
    // Simplified evaluation: for each tree, count care_logs in last 12 hours and award points
    const twelveHoursAgo = Date.now() - 12*60*60*1000;
    const trees = await allAsync('SELECT t.*, ts.name as species_name FROM trees t LEFT JOIN tree_species ts ON t.species_id = ts.id');
    for (const tree of trees) {
      const careCounts = await getAsync(`SELECT 
        SUM(CASE WHEN action='water' THEN 1 ELSE 0 END) as water_count,
        SUM(CASE WHEN action='feed' THEN 1 ELSE 0 END) as feed_count,
        SUM(CASE WHEN action='sunlight' THEN 1 ELSE 0 END) as sunlight_count,
        SUM(CASE WHEN action='love' THEN 1 ELSE 0 END) as love_count
        FROM care_logs WHERE tree_id = ? AND created_at >= ?`, [tree.id, twelveHoursAgo]);
      const water = careCounts.water_count || 0;
      const feed = careCounts.feed_count || 0;
      const sunlight = careCounts.sunlight_count || 0;
      const love = careCounts.love_count || 0;
      const points = water + feed + sunlight + love;
      // update tree points and maybe stage up if threshold met
      const newLove = (tree.love_points || 0) + points;
      let newStage = tree.growth_stage || 'seedling';
      if (newLove > 50) newStage = 'sapling';
      if (newLove > 150) newStage = 'full_tree';
      await runAsync('UPDATE trees SET love_points = ?, growth_stage = ? WHERE id = ?', [newLove, newStage, tree.id]);
    }
    res.json({ ok: true, processed: trees.length });
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