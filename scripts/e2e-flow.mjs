// Uji alur bisnis end-to-end lewat API, tanpa membuka browser.
// Membuat user percobaan, menjalankan seluruh alur, lalu membersihkan.
//
// Jalankan: node scripts/e2e-flow.mjs

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
function check(label, ok, detail) {
  if (ok) {
    pass++;
    console.log(`PASS  ${label}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}  ${detail ?? ""}`);
  }
}

const stamp = Date.now();
const email = `e2e-${stamp}@fbk-e2e.dev`;
const password = `E2e!${stamp}Aa`;

const svc = async (path, init = {}) => {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: S, ...init });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
};

let userId = null;
let pkgId = null;

async function cleanup() {
  if (pkgId) {
    await svc(`transactions?package_id=eq.${pkgId}`, { method: "DELETE" });
    await svc(`user_packages?package_id=eq.${pkgId}`, { method: "DELETE" });
    await svc(`package_contents?package_id=eq.${pkgId}`, { method: "DELETE" });
    await svc(`packages?id=eq.${pkgId}`, { method: "DELETE" });
  }
  if (userId) {
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
  }
}

try {
  // ── Siapkan user & paket ────────────────────────────────────────────────
  const created = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: S,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!created.ok) throw new Error(`buat user: ${await created.text()}`);
  const user = await created.json();
  userId = user.id;

  const tokenRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anon, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await tokenRes.json();
  const U = { apikey: anon, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
  const asUser = async (path, init = {}) => {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers: U, ...init });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body };
  };

  const pkgRow = await svc("packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ title: `__e2e_${stamp}__`, price: 50000, product_type: "PRIVAT_SATUAN", is_active: true }),
  });
  if (!pkgRow.ok) throw new Error(`buat paket: ${JSON.stringify(pkgRow.body)}`);
  pkgId = pkgRow.body[0].id;

  console.log(`user  : ${email}`);
  console.log(`paket : ${pkgId}\n`);

  // ── 1. Profil otomatis dibuat ───────────────────────────────────────────
  const prof = await svc(`profiles?id=eq.${userId}&select=id,student_code`);
  check("profil siswa dibuat dengan kode unik", prof.ok && !!prof.body[0]?.student_code, JSON.stringify(prof.body));

  // ── 2. Siswa meminta paket (chat) ───────────────────────────────────────
  const req = await asUser("rpc/request_package_access", {
    method: "POST",
    body: JSON.stringify({ p_package_id: pkgId }),
  });
  check("siswa bisa meminta paket lewat WhatsApp", req.ok, JSON.stringify(req.body));

  const afterReq = await svc(`transactions?user_id=eq.${userId}&package_id=eq.${pkgId}&select=status,amount,expiry_date`);
  const tx1 = afterReq.body?.[0];
  check("permintaan tercatat status pending", tx1?.status === "pending", JSON.stringify(tx1));
  check("nominal diambil dari database, bukan klien", tx1?.amount === 50000, String(tx1?.amount));

  const expiry = tx1?.expiry_date ? new Date(tx1.expiry_date).getTime() : 0;
  const hours = (expiry - Date.now()) / 3_600_000;
  check("masa berlaku ±24 jam", hours > 23.5 && hours <= 24.1, `${hours.toFixed(2)} jam`);

  // ── 3. Siswa belum punya akses ──────────────────────────────────────────
  const before = await svc(`user_packages?user_id=eq.${userId}&package_id=eq.${pkgId}`);
  check("sebelum dikonfirmasi, siswa belum punya akses", before.body?.length === 0, JSON.stringify(before.body));

  // ── 4. Permintaan kedua memakai baris yang sama ─────────────────────────
  await asUser("rpc/request_package_access", { method: "POST", body: JSON.stringify({ p_package_id: pkgId }) });
  const afterReq2 = await svc(`transactions?user_id=eq.${userId}&package_id=eq.${pkgId}`);
  check("klik ulang tidak membuat permintaan ganda", afterReq2.body?.length === 1, `rows=${afterReq2.body?.length}`);

  // ── 5. Admin memberi akses ──────────────────────────────────────────────
  const granted = await svc("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ user_id: userId, package_id: pkgId }),
  });
  check("admin bisa memberi akses", granted.ok, JSON.stringify(granted.body));

  const afterGrant = await svc(`transactions?user_id=eq.${userId}&package_id=eq.${pkgId}&select=status`);
  check("status transaksi menjadi success", afterGrant.body?.[0]?.status === "success", JSON.stringify(afterGrant.body));

  // ── 6. Siswa melihat paketnya ───────────────────────────────────────────
  const owned = await asUser(`user_packages?select=package_id,packages(title)&user_id=eq.${userId}`);
  check("paket muncul di Paket Saya", owned.body?.[0]?.packages?.title?.includes("__e2e_"), JSON.stringify(owned.body));

  // ── 7. Omzet tercatat ───────────────────────────────────────────────────
  const omzet = await svc(`transactions?package_id=eq.${pkgId}&status=eq.success&select=amount`);
  const total = (omzet.body ?? []).reduce((a, r) => a + r.amount, 0);
  check("omzet bertambah sebesar harga paket", total === 50000, `total=${total}`);

  // ── 8. Cabut akses membatalkan penjualan ────────────────────────────────
  await svc(`user_packages?user_id=eq.${userId}&package_id=eq.${pkgId}`, { method: "DELETE" });
  const afterRevoke = await svc(`transactions?user_id=eq.${userId}&package_id=eq.${pkgId}&select=status`);
  check("cabut akses -> transaksi cancelled", afterRevoke.body?.[0]?.status === "cancelled", JSON.stringify(afterRevoke.body));

  const omzet2 = await svc(`transactions?package_id=eq.${pkgId}&status=eq.success&select=amount`);
  check("omzet kembali nol setelah dicabut", (omzet2.body ?? []).length === 0, JSON.stringify(omzet2.body));

  // ── 9. Beri akses lagi tidak dobel ──────────────────────────────────────
  await svc("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: userId, package_id: pkgId }),
  });
  const afterRegrant = await svc(`transactions?user_id=eq.${userId}&package_id=eq.${pkgId}`);
  check("beri akses lagi tidak membuat baris baru", afterRegrant.body?.length === 1, `rows=${afterRegrant.body?.length}`);
  check("status kembali success", afterRegrant.body?.[0]?.status === "success", JSON.stringify(afterRegrant.body));

  // ── 10. Paket gratis ────────────────────────────────────────────────────
  const freePkg = await svc("packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ title: `__e2e_free_${stamp}__`, price: 0, product_type: "BUNDLE", is_active: true }),
  });
  const freeId = freePkg.body[0].id;
  const claim = await asUser("rpc/claim_free_package", { method: "POST", body: JSON.stringify({ p_package_id: freeId }) });
  check("paket gratis bisa diklaim langsung", claim.ok, JSON.stringify(claim.body));

  const freeTx = await svc(`transactions?user_id=eq.${userId}&package_id=eq.${freeId}&select=amount,status`);
  check("paket gratis tercatat nominal 0", freeTx.body?.[0]?.amount === 0, JSON.stringify(freeTx.body));

  await svc(`transactions?package_id=eq.${freeId}`, { method: "DELETE" });
  await svc(`user_packages?package_id=eq.${freeId}`, { method: "DELETE" });
  await svc(`packages?id=eq.${freeId}`, { method: "DELETE" });

  // ── 11. Kuota kelas ─────────────────────────────────────────────────────
  const kelas = await svc("packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ title: `__e2e_kelas_${stamp}__`, price: 10000, product_type: "KELAS" }),
  });
  const kelasId = kelas.body[0].id;
  check("paket kelas otomatis berkuota 5", kelas.body[0].quota === 5, `quota=${kelas.body[0].quota}`);

  await svc("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: userId, package_id: kelasId }),
  });
  const kelasAfter = await svc(`packages?id=eq.${kelasId}&select=quota,seats_taken`);
  check("kursi terisi 1/5 setelah akses diberikan", kelasAfter.body[0].seats_taken === 1, JSON.stringify(kelasAfter.body[0]));

  await svc(`transactions?package_id=eq.${kelasId}`, { method: "DELETE" });
  await svc(`user_packages?package_id=eq.${kelasId}`, { method: "DELETE" });
  await svc(`packages?id=eq.${kelasId}`, { method: "DELETE" });
} catch (err) {
  console.error("\nERROR:", err.message);
  fail++;
} finally {
  await cleanup();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
