// Uji: apakah is_fbk_admin() kini bisa dipanggil oleh pengguna login,
// dan apakah upload gambar ke bucket question-images tidak lagi gagal
// dengan "permission denied for function is_fbk_admin".
//
// Jalankan: node scripts/test-upload-permission.mjs

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

const stamp = Date.now();
const email = `upload.${stamp}@fbk-upload.dev`;
const password = `Up!${stamp}Aa`;

let userId = null;
const hasil = [];

function cek(label, ok, detail) {
  hasil.push({ label, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  " + detail : ""}`);
}

try {
  // Buat user admin percobaan
  const created = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: S,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
    }),
  });
  if (!created.ok) throw new Error(await created.text());
  const u = await created.json();
  userId = u.id ?? u.user?.id;

  // Login sebagai user tersebut
  const session = await (
    await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  ).json();
  const U = { apikey: anon, Authorization: `Bearer ${session.access_token}` };

  // 1. Panggil is_fbk_admin sebagai pengguna login
  const rpc = await fetch(`${url}/rest/v1/rpc/is_fbk_admin`, {
    method: "POST",
    headers: { ...U, "Content-Type": "application/json" },
    body: "{}",
  });
  const rpcText = await rpc.text();
  const permissionDenied = /permission denied for function/i.test(rpcText);
  cek(
    "is_fbk_admin() bisa dipanggil pengguna login",
    !permissionDenied,
    permissionDenied ? rpcText.slice(0, 120) : `HTTP ${rpc.status} -> ${rpcText.slice(0, 40)}`
  );

  // 2. Upload gambar percobaan ke question-images
  const nama = `test-${stamp}.png`;
  // PNG 1x1 piksel
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const up = await fetch(`${url}/storage/v1/object/question-images/${nama}`, {
    method: "POST",
    headers: { ...U, "Content-Type": "image/png", "x-upsert": "true" },
    body: png,
  });
  const upText = await up.text();
  const upPermission = /permission denied for function is_fbk_admin/i.test(upText);
  cek(
    "upload gambar tidak gagal karena izin fungsi",
    !upPermission,
    upPermission ? upText.slice(0, 140) : `HTTP ${up.status} -> ${upText.slice(0, 80)}`
  );
  cek(
    "upload gambar berhasil (admin)",
    up.ok,
    up.ok ? "objek tersimpan" : `HTTP ${up.status}`
  );

  // Bersihkan objek
  if (up.ok) {
    await fetch(`${url}/storage/v1/object/question-images/${nama}`, {
      method: "DELETE",
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
  }

  // 3. Non-admin tidak boleh upload
  const email2 = `student.${stamp}@fbk-upload.dev`;
  const c2 = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: S,
    body: JSON.stringify({ email: email2, password, email_confirm: true }),
  });
  const u2 = await c2.json();
  const id2 = u2.id ?? u2.user?.id;
  const s2 = await (
    await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email2, password }),
    })
  ).json();
  const up2 = await fetch(`${url}/storage/v1/object/question-images/student-${stamp}.png`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${s2.access_token}`, "Content-Type": "image/png" },
    body: png,
  });
  cek("siswa biasa TIDAK bisa upload", !up2.ok, `HTTP ${up2.status}`);

  await fetch(`${url}/auth/v1/admin/users/${id2}`, { method: "DELETE", headers: S });
} catch (err) {
  console.error("ERROR:", err.message);
  hasil.push({ label: "runtime", ok: false, detail: err.message });
} finally {
  if (userId) {
    await fetch(`${url}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: S });
  }
  const gagal = hasil.filter((h) => !h.ok).length;
  console.log(`\n== ${hasil.length - gagal} pass, ${gagal} fail ==`);
  process.exit(gagal > 0 ? 1 : 0);
}
