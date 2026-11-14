// Probe RLS & RPC dengan anon key (tanpa login).
// Tujuan: memastikan siswa anonim tidak bisa membaca/menulis tabel terlarang
// dan tidak bisa memanggil fungsi admin.
//
// Jalankan: node scripts/probe-rls.mjs

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
const anon = env.VITE_SUPABASE_ANON_KEY;
const H = { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" };

let pass = 0;
let fail = 0;

function report(label, ok, detail) {
  if (ok) {
    pass++;
    console.log(`PASS  ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}  ${detail ?? ""}`);
  }
}

async function probeRead(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, { headers: H });
  const body = await res.text();
  let rows = null;
  try {
    rows = JSON.parse(body);
  } catch {
    /* bukan json */
  }
  // Aman bila ditolak ATAU mengembalikan array kosong.
  const blocked = !res.ok || (Array.isArray(rows) && rows.length === 0);
  return { blocked, status: res.status, body: body.slice(0, 160) };
}

async function probeWrite(table, payload) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  return { blocked: !res.ok, status: res.status, body: (await res.text()).slice(0, 160) };
}

async function probeRpc(fn, payload) {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: H,
    body: JSON.stringify(payload),
  });
  return { blocked: !res.ok, status: res.status, body: (await res.text()).slice(0, 200) };
}

console.log("== Baca tabel (anon harus ditolak / kosong) ==");
for (const t of [
  "profiles",
  "transactions",
  "user_packages",
  "tryout_questions",
  "tryout_results",
  "package_contents",
  "active_tryout_sessions",
  "notifications",
]) {
  const r = await probeRead(t);
  report(`read ${t}`, r.blocked, `HTTP ${r.status} ${r.body}`);
}

console.log("\n== Tulis tabel (anon harus ditolak) ==");
const writes = [
  ["user_packages", { user_id: "00000000-0000-0000-0000-000000000000", package_id: "00000000-0000-0000-0000-000000000000" }],
  ["transactions", { amount: 1, user_id: "00000000-0000-0000-0000-000000000000" }],
  ["tryout_results", { user_id: "00000000-0000-0000-0000-000000000000", total: 500 }],
  ["profiles", { id: "00000000-0000-0000-0000-000000000000", full_name: "probe" }],
  ["packages", { title: "probe", price: 0 }],
];
for (const [t, payload] of writes) {
  const r = await probeWrite(t, payload);
  report(`write ${t}`, r.blocked, `HTTP ${r.status} ${r.body}`);
}

console.log("\n== RPC admin (anon harus ditolak) ==");
const rpcs = [
  ["admin_confirm_payment", { p_transaction_id: "00000000-0000-0000-0000-000000000000" }],
  ["admin_search_students", { p_query: "", p_limit: 5 }],
  ["request_package_access", { p_package_id: "00000000-0000-0000-0000-000000000000" }],
  ["grant_package", { p_transaction_id: "00000000-0000-0000-0000-000000000000" }],
  ["delete_user_by_admin", { p_user_id: "00000000-0000-0000-0000-000000000000" }],
  ["broadcast_notification", { p_title: "x", p_message: "y", p_type: "info" }],
];
for (const [fn, payload] of rpcs) {
  const r = await probeRpc(fn, payload);
  report(`rpc ${fn}`, r.blocked, `HTTP ${r.status} ${r.body}`);
}

console.log(`\n== Ringkasan: ${pass} pass, ${fail} fail ==`);
if (fail > 0) process.exit(1);
