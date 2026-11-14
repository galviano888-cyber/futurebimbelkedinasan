// Backup data Supabase ke file JSON lokal.
// Dipakai karena pg_dump/Docker tidak tersedia di mesin ini.
//
// Jalankan: node scripts/backup-data.mjs
// Membaca VITE_SUPABASE_URL dan PAKASIR_SUPABASE_SERVICE_ROLE_KEY dari .env.local
// (nama variabel lama, nilainya tetap service role key project ini).
//
// Hasil: backups/<tanggal-jam>/<tabel>.json + auth-users.json + _manifest.json

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnv() {
  const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("VITE_SUPABASE_URL atau PAKASIR_SUPABASE_SERVICE_ROLE_KEY tidak ada di .env.local");
  process.exit(1);
}

const TABLES = [
  "profiles",
  "packages",
  "package_contents",
  "tryout_packages",
  "tryout_questions",
  "tryout_results",
  "transactions",
  "user_packages",
  "site_settings",
  "events",
  "event_results",
  "notifications",
  "payment_events",
];

const PAGE = 1000;

async function fetchPage(table, from, to) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Range: `${from}-${to}`,
      "Range-Unit": "items",
      Prefer: "count=exact",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${table} ${res.status}: ${body.slice(0, 300)}`);
  }
  const rows = await res.json();
  const range = res.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1] ?? rows.length);
  return { rows, total };
}

async function dumpTable(table) {
  let all = [];
  let from = 0;
  let total = Infinity;

  while (from < total) {
    const { rows, total: t } = await fetchPage(table, from, from + PAGE - 1);
    total = Number.isFinite(t) ? t : rows.length;
    all = all.concat(rows);
    if (rows.length === 0) break;
    from += PAGE;
  }

  return all;
}

async function dumpAuthUsers() {
  const res = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return { error: `${res.status} ${await res.text()}` };
  const body = await res.json();
  return body.users ?? body;
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dir = resolve(ROOT, "backups", stamp);
mkdirSync(dir, { recursive: true });

const manifest = { created_at: new Date().toISOString(), project: url, tables: {} };

for (const table of TABLES) {
  try {
    const rows = await dumpTable(table);
    writeFileSync(resolve(dir, `${table}.json`), JSON.stringify(rows, null, 2), "utf8");
    manifest.tables[table] = { rows: rows.length, status: "ok" };
    console.log(`${table.padEnd(20)} ${rows.length} baris`);
  } catch (err) {
    manifest.tables[table] = { status: "error", error: String(err.message ?? err) };
    console.log(`${table.padEnd(20)} GAGAL: ${err.message}`);
  }
}

try {
  const users = await dumpAuthUsers();
  writeFileSync(resolve(dir, "auth-users.json"), JSON.stringify(users, null, 2), "utf8");
  manifest.tables["auth.users"] = {
    rows: Array.isArray(users) ? users.length : 0,
    status: Array.isArray(users) ? "ok" : "error",
  };
  console.log(`auth.users           ${Array.isArray(users) ? users.length : 0} baris`);
} catch (err) {
  manifest.tables["auth.users"] = { status: "error", error: String(err.message ?? err) };
  console.log(`auth.users           GAGAL: ${err.message}`);
}

writeFileSync(resolve(dir, "_manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

const failed = Object.entries(manifest.tables).filter(([, v]) => v.status !== "ok");
console.log(`\nBackup: ${dir}`);
if (failed.length) {
  console.error(`Tabel gagal: ${failed.map(([k]) => k).join(", ")}`);
  process.exit(2);
}
console.log("Semua tabel berhasil dibackup.");
