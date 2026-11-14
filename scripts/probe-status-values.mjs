// Menemukan nilai `status` yang diizinkan oleh check constraint pada
// public.transactions. Membuat satu baris uji per kandidat, lalu menghapusnya.
//
// Jalankan: node scripts/probe-status-values.mjs

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
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const candidates = [
  "pending",
  "verifying",
  "success",
  "failed",
  "expired",
  "cancelled",
  "canceled",
  "refunded",
  "reversed",
  "void",
  "abandoned",
];

const created = [];

for (const status of candidates) {
  const res = await fetch(`${url}/rest/v1/transactions`, {
    method: "POST",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({
      amount: 1,
      status,
      payment_method: "probe_status",
      invoice_id: `PROBE-${status}-${Date.now()}`,
    }),
  });
  const body = await res.text();
  if (res.ok) {
    const row = JSON.parse(body)[0];
    created.push(row.id);
    console.log(`DIIZINKAN   ${status}`);
  } else {
    const short = body.includes("transactions_status_check")
      ? "ditolak check constraint"
      : body.slice(0, 90);
    console.log(`DITOLAK     ${status}  (${short})`);
  }
}

// Bersihkan.
if (created.length) {
  const ids = created.map((id) => `"${id}"`).join(",");
  await fetch(`${url}/rest/v1/transactions?id=in.(${ids})`, { method: "DELETE", headers: H });
  console.log(`\n${created.length} baris uji dihapus.`);
} else {
  console.log("\nTidak ada baris uji yang perlu dihapus.");
}
