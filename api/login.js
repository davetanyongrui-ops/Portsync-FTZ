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
    const { email, password } = body;
    if (!email || !password) return res.status(400).json({ ok: false, error: "Missing fields." });

    await ensureUsersTable();
    const hash = sha256Hex(password);
    const r = await tursoExecute("SELECT name, email FROM users WHERE email = ? AND password_hash = ?", [email.toLowerCase(), hash]);
    if (r.rows.length === 0) return res.status(401).json({ ok: false, error: "Invalid email or password." });

    const row = r.rows[0];
    return res.status(200).json({ ok: true, user: { email: row.email, name: row.name } });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
