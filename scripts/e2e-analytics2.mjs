// Uji agregasi statistik melewati batas 1000 baris PostgREST.
// Membuktikan angka funnel tetap benar walau data mentah > 1000 baris.
//
// Jalankan: node scripts/e2e-analytics2.mjs

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
const marker = `agg-${stamp}`;

async function cleanup() {
  await fetch(`${url}/rest/v1/analytics_events?session_id=like.${marker}*`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
}

try {
  await cleanup();

  // 1200 sesi unik untuk view_landing, ditambah 40 sesi view_paket.
  // Total baris > 1000, sehingga query mentah dari browser akan terpotong.
  const rows = [];
  for (let i = 0; i < 1200; i++) {
    rows.push({ name: "view_landing", session_id: `${marker}-l${i}`, path: "/", meta: {} });
  }
  for (let i = 0; i < 40; i++) {
    rows.push({ name: "view_paket", session_id: `${marker}-p${i}`, path: "/paket", meta: {} });
  }

  // Sisipkan bertahap agar tidak melewati batas payload.
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const res = await fetch(`${url}/rest/v1/analytics_events`, {
      method: "POST",
      headers: { ...S, Prefer: "return=minimal" },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`insert gagal: ${res.status} ${await res.text()}`);
  }

  const total = await fetch(`${url}/rest/v1/analytics_events?select=id&session_id=like.${marker}*`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  const insertedRows = await total.json();
  check("data uji > 1000 baris tersimpan", insertedRows.length >= 1000, `rows=${insertedRows.length}`);

  // Query mentah (cara lama) terpotong di 1000.
  const raw = await fetch(
    `${url}/rest/v1/analytics_events?select=name,session_id&session_id=like.${marker}*&limit=50000`,
    { headers: { apikey: service, Authorization: `Bearer ${service}` } }
  );
  const rawRows = await raw.json();
  check("query mentah terpotong 1000 (masalah lama)", rawRows.length === 1000, `rows=${rawRows.length}`);

  // Agregasi server: harus melihat seluruh 1240 baris.
  const summary = await fetch(`${url}/rest/v1/rpc/admin_analytics_summary`, {
    method: "POST",
    headers: S,
    body: JSON.stringify({ p_days: 1 }),
  });
  const summaryRows = await summary.json();

  // Cari baris khusus data uji (fungsi menghitung semua data, jadi bandingkan
  // bahwa angkanya tidak terpotong 1000).
  const landing = Array.isArray(summaryRows)
    ? summaryRows.find((r) => r.event_name === "view_landing")
    : null;
  check(
    "agregasi server tidak terpotong (view_landing >= 1200)",
    landing && Number(landing.unique_sessions) >= 1200,
    `sessions=${landing?.unique_sessions}`
  );

  const paket = Array.isArray(summaryRows)
    ? summaryRows.find((r) => r.event_name === "view_paket")
    : null;
  check(
    "agregasi server menghitung view_paket (>= 40)",
    paket && Number(paket.unique_sessions) >= 40,
    `sessions=${paket?.unique_sessions}`
  );

  // Pengunjung unik juga dihitung server.
  const visitors = await fetch(`${url}/rest/v1/rpc/admin_analytics_visitors`, {
    method: "POST",
    headers: S,
    body: JSON.stringify({ p_days: 1 }),
  });
  const visitorCount = await visitors.json();
  check("pengunjung unik >= 1240", Number(visitorCount) >= 1240, `visitors=${visitorCount}`);

  // Non-admin ditolak.
  const studentToken = await (async () => {
    const email = `agg-${stamp}@fbk-e2e.dev`;
    const password = `Ag!${stamp}Aa`;
    const created = await fetch(`${url}/auth/v1/admin/users`, {
      method: "POST",
      headers: S,
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const u = await created.json();
    const t = (
      await (
        await fetch(`${url}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: { apikey: anon, "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
      ).json()
    ).access_token;
    return { id: u.id ?? u.user?.id, token: t };
  })();

  const denied = await fetch(`${url}/rest/v1/rpc/admin_analytics_summary`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${studentToken.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_days: 7 }),
  });
  check("siswa biasa tidak bisa membaca statistik", !denied.ok, `HTTP ${denied.status}`);

  await fetch(`${url}/auth/v1/admin/users/${studentToken.id}`, {
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
