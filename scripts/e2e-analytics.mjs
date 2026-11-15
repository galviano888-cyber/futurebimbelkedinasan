// Uji tabel analytics: anonim boleh mencatat event, siswa tidak boleh membaca,
// admin boleh membaca, dan kolom referral sudah hilang.
//
// Jalankan: node scripts/e2e-analytics.mjs

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
const service = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;
const S = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
const A = { apikey: anon, Authorization: `Bearer ${anon}`, "Content-Type": "application/json" };

let pass = 0;
let fail = 0;
const check = (label, ok, detail) => {
  if (ok) {
    pass++;
    console.log(`PASS  ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}  ${detail ?? ""}`);
  }
};

const stamp = Date.now();
const email = `analytics-${stamp}@fbk-e2e.dev`;
const password = `An!${stamp}Aa`;
let userId = null;

async function cleanup() {
  if (userId) {
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
  }
}

try {
  // ── Kolom referral hilang ───────────────────────────────────────────────
  const spec = await (
    await fetch(`${url}/rest/v1/`, { headers: { apikey: service, Authorization: `Bearer ${service}` } })
  ).json();
  const cols = Object.keys(spec.definitions.profiles.properties);
  check("kolom referral_code sudah dihapus", !cols.includes("referral_code"), cols.join(","));
  check("kolom referral_points sudah dihapus", !cols.includes("referral_points"), cols.join(","));

  // ── Anonim boleh mencatat event ─────────────────────────────────────────
  const marker = `test-${stamp}`;
  const ins = await fetch(`${url}/rest/v1/analytics_events`, {
    method: "POST",
    headers: { ...A, Prefer: "return=minimal" },
    body: JSON.stringify([
      { name: "view_landing", session_id: marker, path: "/", meta: {} },
      { name: "view_pricing", session_id: marker, path: "/", meta: {} },
      { name: "click_wa", session_id: marker, path: "/paket", meta: { package_title: "x" } },
    ]),
  });
  check("anonim bisa mencatat event", ins.ok, `HTTP ${ins.status} ${await ins.text()}`);

  // ── Nama event tidak dikenal ditolak ────────────────────────────────────
  const bad = await fetch(`${url}/rest/v1/analytics_events`, {
    method: "POST",
    headers: { ...A, Prefer: "return=minimal" },
    body: JSON.stringify([{ name: "sembarang_event", session_id: marker }]),
  });
  check("nama event tak dikenal ditolak", !bad.ok, `HTTP ${bad.status}`);

  // ── Anonim tidak boleh membaca ──────────────────────────────────────────
  const anonRead = await fetch(`${url}/rest/v1/analytics_events?select=id&limit=1`, { headers: A });
  let anonRows = [];
  try {
    anonRows = await anonRead.json();
  } catch {
    /* ignore */
  }
  check(
    "anonim tidak bisa membaca analytics",
    !anonRead.ok || (Array.isArray(anonRows) && anonRows.length === 0),
    `HTTP ${anonRead.status}`
  );

  // ── Siswa login juga tidak boleh membaca ────────────────────────────────
  const created = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: S,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!created.ok) throw new Error(await created.text());
  userId = (await created.json()).id;

  const token = (
    await (
      await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: anon, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
    ).json()
  ).access_token;

  const U = { apikey: anon, Authorization: `Bearer ${token}` };
  const studentRead = await fetch(`${url}/rest/v1/analytics_events?select=id&limit=1`, { headers: U });
  let studentRows = [];
  try {
    studentRows = await studentRead.json();
  } catch {
    /* ignore */
  }
  check(
    "siswa login tidak bisa membaca analytics",
    !studentRead.ok || (Array.isArray(studentRows) && studentRows.length === 0),
    `HTTP ${studentRead.status}`
  );

  // ── Service role bisa membaca (dipakai panel admin) ─────────────────────
  const svcRead = await fetch(`${url}/rest/v1/analytics_events?select=name&session_id=eq.${marker}`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  const rows = await svcRead.json();
  check("event tercatat lengkap", Array.isArray(rows) && rows.length === 3, `rows=${rows?.length}`);

  // Bersihkan event uji.
  await fetch(`${url}/rest/v1/analytics_events?session_id=eq.${marker}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
} catch (err) {
  console.error("\nERROR:", err.message);
  fail++;
} finally {
  await cleanup();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
