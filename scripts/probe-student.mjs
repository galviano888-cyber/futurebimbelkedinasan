// Probe sebagai SISWA LOGIN (bukan anon).
// Membuat user percobaan sementara, menguji hal-hal paling berbahaya,
// lalu menghapus user tersebut di akhir.
//
// Jalankan: node scripts/probe-student.mjs

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

const stamp = Date.now();
const email = `probe-${stamp}@fbk-probe.dev`;
const password = `Probe!${stamp}Aa`;

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

async function createUser() {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!res.ok) throw new Error(`create user: ${res.status} ${await res.text()}`);
  return res.json();
}

async function signIn() {
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`signin: ${res.status} ${await res.text()}`);
  return res.json();
}

async function deleteUser(id) {
  await fetch(`${url}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
}

async function main() {
  const user = await createUser();
  const session = await signIn();
  const token = session.access_token;
  const H = { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  console.log(`user percobaan: ${email}\n`);

  // Ambil id paket nyata untuk uji.
  const pkgRes = await fetch(`${url}/rest/v1/packages?select=id,title,price&limit=1`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
  const pkgs = await pkgRes.json();
  const pkg = pkgs[0];

  // 1. Siswa memberi paket ke dirinya sendiri (risiko utama).
  let res = await fetch(`${url}/rest/v1/user_packages`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: user.id, package_id: pkg.id }),
  });
  report("siswa TIDAK bisa insert user_packages sendiri", !res.ok, `HTTP ${res.status}`);

  // 2. Siswa mengubah harga paket.
  // PostgREST membalas 204 walaupun 0 baris berubah (RLS memblokir), jadi
  // keberhasilan harus dinilai dari jumlah baris yang benar-benar terpengaruh.
  res = await fetch(`${url}/rest/v1/packages?id=eq.${pkg.id}`, {
    method: "PATCH",
    headers: { ...H, Prefer: "return=representation" },
    body: JSON.stringify({ price: 1 }),
  });
  let changed = [];
  try {
    changed = await res.json();
  } catch {
    /* ignore */
  }
  report(
    "siswa TIDAK bisa mengubah harga paket",
    !res.ok || (Array.isArray(changed) && changed.length === 0),
    `HTTP ${res.status} rows=${Array.isArray(changed) ? changed.length : "?"}`
  );

  // 3. Siswa membuat transaksi sukses sendiri.
  res = await fetch(`${url}/rest/v1/transactions`, {
    method: "POST",
    headers: { ...H, Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: user.id, package_id: pkg.id, amount: 0, status: "success" }),
  });
  report("siswa TIDAK bisa membuat transaksi", !res.ok, `HTTP ${res.status}`);

  // 4. Siswa membaca daftar seluruh siswa (harus hanya dirinya).
  res = await fetch(`${url}/rest/v1/profiles?select=id,email`, { headers: H });
  let rows = [];
  try {
    rows = await res.json();
  } catch {
    /* ignore */
  }
  const onlySelf = Array.isArray(rows) && rows.every((r) => r.id === user.id);
  report("siswa hanya bisa melihat profilnya sendiri", onlySelf, `rows=${Array.isArray(rows) ? rows.length : "?"}`);

  // 5. Siswa membaca soal langsung (harus kosong).
  res = await fetch(`${url}/rest/v1/tryout_questions?select=*&limit=1`, { headers: H });
  let q = [];
  try {
    q = await res.json();
  } catch {
    /* ignore */
  }
  report("siswa TIDAK bisa baca tryout_questions langsung", !Array.isArray(q) || q.length === 0, `rows=${Array.isArray(q) ? q.length : "?"}`);

  // 6. Siswa memanggil RPC admin.
  for (const [fn, payload] of [
    ["admin_confirm_payment", { p_transaction_id: "00000000-0000-0000-0000-000000000000" }],
    ["admin_search_students", { p_query: "", p_limit: 5 }],
    ["grant_package", { p_transaction_id: "00000000-0000-0000-0000-000000000000" }],
  ]) {
    const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers: H, body: JSON.stringify(payload) });
    report(`siswa TIDAK bisa memanggil ${fn}`, !r.ok, `HTTP ${r.status}`);
  }

  // 7. Siswa membaca hasil tryout siswa lain.
  res = await fetch(`${url}/rest/v1/tryout_results?select=user_id&limit=5`, { headers: H });
  let tr = [];
  try {
    tr = await res.json();
  } catch {
    /* ignore */
  }
  const trSelf = Array.isArray(tr) && tr.every((r) => r.user_id === user.id);
  report("siswa hanya bisa melihat hasil tryout sendiri", trSelf, `rows=${Array.isArray(tr) ? tr.length : "?"}`);

  await deleteUser(user.id);
  console.log(`\nuser percobaan dihapus`);

  console.log(`\n== Ringkasan: ${pass} pass, ${fail} fail ==`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(2);
});
