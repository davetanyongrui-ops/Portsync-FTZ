import { tursoExecute, ensureUsersTable, sha256Hex } from "./_lib/turso.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { name, email, password } = body;
    if (!name || !email || !password) return res.status(400).json({ ok: false, error: "Missing fields." });
    if (password.length < 6) return res.status(400).json({ ok: false, error: "Password must be at least 6 characters." });

    await ensureUsersTable();
    const existing = await tursoExecute("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(409).json({ ok: false, error: "An account with this email already exists." });

    const hash = sha256Hex(password);
    await tursoExecute("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)", [name, email.toLowerCase(), hash]);
    return res.status(200).json({ ok: true, user: { email: email.toLowerCase(), name } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
