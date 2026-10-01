const express = require("express"), fs = require("fs"), path = require("path");
const bcrypt = require("bcryptjs"), jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("Set JWT_SECRET in production."); process.exit(1);
}
const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const FILE = path.join(DIR, "db.json");
fs.mkdirSync(DIR, { recursive: true });

let db = { users: {}, saves: [] };
try { db = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) {}
const flush = () => { fs.writeFileSync(FILE + ".tmp", JSON.stringify(db)); fs.renameSync(FILE + ".tmp", FILE); };

// Admin registration needs this secret code (set ADMIN_CODE). In production there is no default.
const ADMIN_CODE = process.env.ADMIN_CODE || (process.env.NODE_ENV === "production" ? "" : "admin2026");
if (!process.env.ADMIN_CODE) console.warn(ADMIN_CODE ? "WARNING: ADMIN_CODE not set, dev default 'admin2026' in use." : "ADMIN_CODE not set: admin registration is disabled.");
// Optional: also create/update a fixed admin from ADMIN_USER + ADMIN_PASS.
if (process.env.ADMIN_PASS) {
  const AU = (process.env.ADMIN_USER || "admin").toLowerCase();
  db.users[AU] = { sheet: [], ...(db.users[AU] || {}), hash: bcrypt.hashSync(process.env.ADMIN_PASS, 10), role: "admin" };
}
flush();

const FIELDS = ["date", "item", "open", "inn", "sales", "system", "debt"];
const clean = rows => (Array.isArray(rows) ? rows : []).slice(0, 2000).map(r => {
  const o = {}; FIELDS.forEach(f => o[f] = String((r && r[f]) ?? "").slice(0, 80)); return o;
});
const token = u => jwt.sign({ u }, SECRET, { expiresIn: "30d" });
const pub = u => ({ username: u, role: db.users[u].role });

const auth = (req, res, next) => {
  try {
    const p = jwt.verify((req.headers.authorization || "").slice(7), SECRET);
    if (!db.users[p.u]) throw new Error("no user");
    req.u = p.u; req.role = db.users[p.u].role; next();
  } catch (e) { res.status(401).json({ error: "auth" }); }
};
const adminOnly = (req, res, next) => req.role === "admin" ? next() : res.status(403).json({ error: "forbidden" });

const app = express();
app.use(express.json({ limit: "2mb" }));

app.post("/api/register", (req, res) => {
  const u = String(req.body.username || "").trim().toLowerCase(), p = String(req.body.password || "");
  if (!/^[a-z0-9_.-]{2,30}$/.test(u) || p.length < 4) return res.status(400).json({ error: "short" });
  if (db.users[u]) return res.status(409).json({ error: "exists" });
  const wantAdmin = req.body.role === "admin";
  if (wantAdmin && !(ADMIN_CODE && String(req.body.code || "") === ADMIN_CODE)) return res.status(403).json({ error: "badcode" });
  db.users[u] = { hash: bcrypt.hashSync(p, 10), role: wantAdmin ? "admin" : "user", sheet: [] }; flush();
  res.json({ token: token(u), user: pub(u) });
});
app.post("/api/login", (req, res) => {
  const u = String(req.body.username || "").trim().toLowerCase(), p = String(req.body.password || "");
  const acc = db.users[u];
  if (!acc || !bcrypt.compareSync(p, acc.hash)) return res.status(401).json({ error: "bad" });
  if (acc.role !== (req.body.role === "admin" ? "admin" : "user")) return res.status(403).json({ error: "role" });
  res.json({ token: token(u), user: pub(u) });
});
app.get("/api/me", auth, (req, res) => res.json(pub(req.u)));

// Working sheet (each user's own)
app.get("/api/sheet", auth, (req, res) => res.json({ rows: db.users[req.u].sheet || [] }));
app.put("/api/sheet", auth, (req, res) => { db.users[req.u].sheet = clean(req.body.rows); flush(); res.json({ ok: 1 }); });

// Saved records: users see their own, admin sees everyone's
app.get("/api/saves", auth, (req, res) =>
  res.json({ saves: db.saves.filter(s => req.role === "admin" || s.owner === req.u) }));
app.post("/api/saves", auth, (req, res) => {
  const s = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), owner: req.u,
    name: String(req.body.name || "").trim().slice(0, 80) || new Date().toISOString().slice(0, 16).replace("T", " "),
    ts: Date.now(), rows: clean(req.body.rows) };
  db.saves.unshift(s); flush(); res.json(s);
});
// Only admin can edit or delete saved records
app.put("/api/saves/:id", auth, adminOnly, (req, res) => {
  const s = db.saves.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: "nf" });
  s.rows = clean(req.body.rows);
  if (req.body.name) s.name = String(req.body.name).slice(0, 80);
  s.editedBy = req.u; s.editedTs = Date.now(); flush(); res.json(s);
});
app.delete("/api/saves/:id", auth, adminOnly, (req, res) => {
  db.saves = db.saves.filter(x => x.id !== req.params.id); flush(); res.json({ ok: 1 });
});

app.use(express.static(path.join(__dirname, "public")));
app.listen(PORT, () => console.log("JikoStock running on port " + PORT));
