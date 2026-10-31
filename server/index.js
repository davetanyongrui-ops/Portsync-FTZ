import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";

// Minimal .env loader (no extra dependency)
try {
  const envText = readFileSync(new URL("./.env", import.meta.url), "utf8");
  for (const line of envText.split(/\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  /* .env optional; rely on process env */
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const TURSO_URL = process.env.TURSO_DATABASE_URL || "libsql://portsync-portsync.aws-ap-northeast-1.turso.io";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || "";
const HTTP_URL = TURSO_URL.replace(/^libsql:\/\//, "https://");

async function tursoExecute(sql, args = []) {
  const res = await fetch(`${HTTP_URL}/v2/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TURSO_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          type: "execute",
          stmt: {
            sql,
            args: args.map((a) => ({ type: typeof a === "number" ? "integer" : "text", value: String(a) })),
          },
        },
        { type: "close" },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const r = data.results?.[0]?.response?.result;
  const cols = r?.cols?.map((c) => c.name) ?? [];
  const rows = (r?.rows ?? []).map((row) => {
    const obj = {};
    row.forEach((cell, i) => {
      const key = cols[i];
      if (key) obj[key] = cell?.value ?? null;
    });
    return obj;
  });
  return { rows, columns: cols };
}

async function ensureUsersTable() {
  await tursoExecute(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
  );
}

function sha256Hex(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ ok: false, error: "Missing fields." });
    if (password.length < 6) return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });
    await ensureUsersTable();
    const existing = await tursoExecute("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(409).json({ ok: false, error: "An account with this email already exists." });
    const hash = sha256Hex(password);
    await tursoExecute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name, email.toLowerCase(), hash]);
    res.json({ ok: true, user: { email: email.toLowerCase(), name } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: "Missing fields." });
    await ensureUsersTable();
    const hash = sha256Hex(password);
    const r = await tursoExecute("SELECT name, email FROM users WHERE email = ? AND password_hash = ?", [email.toLowerCase(), hash]);
    if (r.rows.length === 0) return res.status(401).json({ ok: false, error: "Invalid email or password." });
    const row = r.rows[0];
    res.json({ ok: true, user: { email: row.email, name: row.name } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`PortSync API listening on ${PORT}`));