// Pemeriksa kondisi database: jumlah baris + migrasi + integritas tautan.
// Jalankan: node scripts/db-status.mjs

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);

const url = env.VITE_SUPABASE_URL;
const key = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;

const TABLES = [
  "packages",
  "package_contents",
  "user_packages",
  "transactions",
  "profiles",
  "tryout_packages",
  "tryout_questions",
  "tryout_results",
  "site_settings",
];

async function rows(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${table}: ${res.status}`);
  return res.json();
}

console.log("== Jumlah baris ==");
const data = {};
for (const t of TABLES) {
  try {
    const r = await rows(t);
    data[t] = r;
    console.log(`${t.padEnd(20)} ${r.length}`);
  } catch (e) {
    console.log(`${t.padEnd(20)} GAGAL (${e.message})`);
  }
}

if (data.packages) {
  console.log("\n== Paket ==");
  for (const p of data.packages) {
    console.log(
      `${p.id}  ${String(p.title).padEnd(38)} ${String(p.product_type).padEnd(14)} ` +
        `rp=${p.price} quota=${p.quota} seats=${p.seats_taken} active=${p.is_active}`
    );
  }
}

if (data.user_packages && data.transactions) {
  const txIds = new Set(data.transactions.map((t) => t.id));
  const dangling = data.user_packages.filter(
    (u) => u.transaction_id && !txIds.has(u.transaction_id)
  );
  console.log(`\nuser_packages dengan transaction_id menggantung: ${dangling.length}`);
  for (const d of dangling.slice(0, 5)) {
    console.log(`  ${d.user_id} -> ${d.transaction_id}`);
  }
}

if (data.packages && data.user_packages) {
  const counts = new Map();
  for (const u of data.user_packages) {
    counts.set(u.package_id, (counts.get(u.package_id) ?? 0) + 1);
  }
  const mismatch = data.packages.filter(
    (p) => (counts.get(p.id) ?? 0) !== (p.seats_taken ?? 0)
  );
  console.log(`\nseats_taken tidak cocok dengan jumlah akses: ${mismatch.length}`);
  for (const m of mismatch) {
    console.log(`  ${m.title}: seats_taken=${m.seats_taken} aktual=${counts.get(m.id) ?? 0}`);
  }
}
