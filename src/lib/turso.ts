const TURSO_URL = "libsql://portsync-portsync.aws-ap-northeast-1.turso.io";
const TURSO_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTM0MzEyMTcsImlkIjoiMDFhMTkwZDQtMmIwMS03Mzc3LTgxMWQtNDU1MDE1NjY2YjliIiwia2lkIjoiVDBwN0NQNGNubFlXdldSdkZpQUJFRWhZRzJ2U185RFpOUmp1d0JDLU14ZyIsInJpZCI6IjJlZTlkZTIyLTI3ZjUtNDRjNC1iMzc2LTk2Y2Q0ZjY2YjlkNSJ9.5dHb8l6MS9O06TKoLKgZMBd8elhEI4mx7EJNJR7FmQe9ltpCtf_xYJP5Vk9Dmgi0r0a-f3R6CZku1xgHcWY2Cg";

const HTTP_URL = TURSO_URL.replace(/^libsql:\/\//, "https://");

interface TursoResult {
  rows: Array<Record<string, unknown>>;
  columns: string[];
}

export async function tursoExecute(sql: string, args: unknown[] = []): Promise<TursoResult> {
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
  const cols: string[] = r?.cols?.map((c: { name: string }) => c.name) ?? [];
  const rows = (r?.rows ?? []).map((row: Array<{ value: unknown }>) => {
    const obj: Record<string, unknown> = {};
    row.forEach((cell, i) => {
      const key = cols[i];
      if (key) obj[key] = cell?.value ?? null;
    });
    return obj;
  });
  return { rows, columns: cols };
}

export async function ensureUsersTable() {
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