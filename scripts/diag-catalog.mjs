// Menjalankan persis query yang dipakai katalog siswa, memakai token siswa
// sungguhan, untuk menemukan penyebab "Memuat katalog..." yang tidak selesai.
//
// Jalankan: node scripts/diag-catalog.mjs

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);
const state = JSON.parse(readFileSync(resolve(ROOT, ".sim-state.json"), "utf8"));

const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY;

const tokenRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email: state.email, password: state.password }),
});
const session = await tokenRes.json();
const token = session.access_token;
if (!token) {
  console.error("LOGIN GAGAL:", JSON.stringify(session).slice(0, 200));
  process.exit(1);
}

const U = { apikey: anon, Authorization: `Bearer ${token}` };

async function run(label, path) {
  const started = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers: U, signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    const ms = Date.now() - started;
    console.log(`${label}`);
    console.log(`   HTTP ${res.status}  ${ms}ms  ${text.slice(0, 180)}`);
  } catch (e) {
    console.log(`${label}`);
    console.log(`   GAGAL setelah ${Date.now() - started}ms: ${e.message}`);
  }
}

console.log("=== Query katalog siswa ===\n");
await run("1. auth user (profiles)", `profiles?select=id&id=eq.${state.userId}`);
await run(
  "2. transaksi menunggu",
  `transactions?select=package_id,expiry_date&user_id=eq.${state.userId}&status=in.(pending,verifying)&expiry_date=gt.${new Date().toISOString()}`
);
await run("3. paket aktif -- select('*, cover_image_url')", `packages?select=*,cover_image_url&is_active=eq.true`);
await run("4. paket aktif -- select('*')", `packages?select=*&is_active=eq.true`);
await run("5. user_packages", `user_packages?select=package_id&user_id=eq.${state.userId}`);
await run("6. package_content_counts", `package_content_counts?select=package_id,content_count`);
await run("7. package_contents (kontrol akses)", `package_contents?select=id&limit=3`);
