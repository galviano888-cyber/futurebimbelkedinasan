// Uji status paket lewat API nyata (bukan SQL): CLOSED menolak pembelian,
// HIDDEN menyembunyikan dari siswa, OPEN kembali normal.
//
// Jalankan: node scripts/e2e-status.mjs

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
const email = `status-${stamp}@fbk-e2e.dev`;
const password = `St!${stamp}Aa`;

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

  const U = { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
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

  const pkg = await svc("packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ title: `__status_${stamp}__`, price: 25000, product_type: "SATUAN", sales_status: "OPEN" }),
  });
  if (!pkg.ok) throw new Error(JSON.stringify(pkg.body));
  pkgId = pkg.body[0].id;

  // 1. OPEN: terlihat siswa dan bisa diminta.
  const openVisible = await asUser(`packages?select=id&id=eq.${pkgId}`);
  check("OPEN terlihat oleh siswa", openVisible.body?.length === 1, JSON.stringify(openVisible.body));

  const openReq = await asUser("rpc/request_package_access", {
    method: "POST",
    body: JSON.stringify({ p_package_id: pkgId }),
  });
  check("OPEN bisa diminta", openReq.ok, JSON.stringify(openReq.body));

  // Bersihkan permintaan supaya uji berikutnya bersih.
  await svc(`transactions?package_id=eq.${pkgId}`, { method: "DELETE" });

  // 2. CLOSED: tetap terlihat, tapi permintaan ditolak.
  await svc(`packages?id=eq.${pkgId}`, { method: "PATCH", body: JSON.stringify({ sales_status: "CLOSED" }) });

  const closedVisible = await asUser(`packages?select=id,sales_status&id=eq.${pkgId}`);
  check("CLOSED tetap terlihat oleh siswa", closedVisible.body?.length === 1, JSON.stringify(closedVisible.body));
  check("status terbaca CLOSED", closedVisible.body?.[0]?.sales_status === "CLOSED", JSON.stringify(closedVisible.body?.[0]));

  const closedReq = await asUser("rpc/request_package_access", {
    method: "POST",
    body: JSON.stringify({ p_package_id: pkgId }),
  });
  check("CLOSED menolak permintaan", !closedReq.ok, `HTTP ${closedReq.status}`);

  // 3. HIDDEN: tidak terlihat siswa.
  await svc(`packages?id=eq.${pkgId}`, { method: "PATCH", body: JSON.stringify({ sales_status: "HIDDEN" }) });

  const hiddenVisible = await asUser(`packages?select=id&id=eq.${pkgId}`);
  check("HIDDEN tidak terlihat oleh siswa", (hiddenVisible.body ?? []).length === 0, JSON.stringify(hiddenVisible.body));

  const adminSees = await svc(`packages?select=id,sales_status&id=eq.${pkgId}`);
  check("admin tetap melihat paket HIDDEN", adminSees.body?.length === 1, JSON.stringify(adminSees.body));

  // 4. Kembali OPEN: normal lagi.
  await svc(`packages?id=eq.${pkgId}`, { method: "PATCH", body: JSON.stringify({ sales_status: "OPEN" }) });

  const backVisible = await asUser(`packages?select=id&id=eq.${pkgId}`);
  check("OPEN kembali terlihat", backVisible.body?.length === 1, JSON.stringify(backVisible.body));

  const backReq = await asUser("rpc/request_package_access", {
    method: "POST",
    body: JSON.stringify({ p_package_id: pkgId }),
  });
  check("OPEN kembali bisa diminta", backReq.ok, JSON.stringify(backReq.body));
} catch (err) {
  console.error("\nERROR:", err.message);
  fail++;
} finally {
  await cleanup();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
