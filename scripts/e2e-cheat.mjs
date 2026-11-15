// Uji pemulihan penghitung pelanggaran (anti-cheat) dari sesi server.
//
// Bug yang diuji: `start_tryout_session` mengembalikan `flagged`, tetapi
// frontend dulu mengabaikannya. Siswa bisa me-refresh halaman untuk
// mengembalikan hitungan ke 0 dan lolos dari penghentian otomatis.
//
// Jalankan: node scripts/e2e-cheat.mjs

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
const email = `cheat-${stamp}@fbk-e2e.dev`;
const password = `Ch!${stamp}Aa`;

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
let tryoutId = null;
let packageId = null;

async function cleanup() {
  if (tryoutId) {
    await svc(`active_tryout_sessions?tryout_id=eq.${tryoutId}`, { method: "DELETE" });
    await svc(`tryout_questions?package_id=eq.${tryoutId}`, { method: "DELETE" });
    await svc(`tryout_packages?id=eq.${tryoutId}`, { method: "DELETE" });
  }
  if (packageId) {
    await svc(`package_contents?package_id=eq.${packageId}`, { method: "DELETE" });
    await svc(`user_packages?package_id=eq.${packageId}`, { method: "DELETE" });
    await svc(`packages?id=eq.${packageId}`, { method: "DELETE" });
  }
  if (userId) {
    await svc(`tryout_results?user_id=eq.${userId}`, { method: "DELETE" });
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
  const createdUser = await created.json();
  userId = createdUser.id ?? createdUser.user?.id;
  if (!userId) throw new Error("id user tidak ditemukan: " + JSON.stringify(createdUser).slice(0, 200));

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
    body: JSON.stringify({ title: `__cheat_${stamp}__`, price: 0, product_type: "SATUAN", sales_status: "OPEN" }),
  });
  packageId = pkg.body[0].id;

  const tp = await svc("tryout_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ name: `__cheat_to_${stamp}__`, duration_minutes: 100, status: "Published" }),
  });
  tryoutId = tp.body[0].id;

  await svc("tryout_questions", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({
      package_id: tryoutId,
      number: 1,
      category: "TWK",
      question_text: "q",
      options: { A: "a", B: "b" },
      correct_answer: "A",
      tkp_scores: null,
      explanation: "x",
    }),
  });

  await svc("package_contents", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({ package_id: packageId, type: "tryout", title: "T", tryout_id: tryoutId, order_index: 1 }),
  });
  await svc("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: userId, package_id: packageId }),
  });

  // ── 1. Sesi baru: penghitung 0 ──────────────────────────────────────────
  const start = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const s1 = Array.isArray(start.body) ? start.body[0] : start.body;
  check("sesi baru: penghitung pelanggaran 0", Number(s1?.flagged ?? -1) === 0, `flagged=${s1?.flagged}`);

  // ── 2. Catat 2 pelanggaran lewat autosave ───────────────────────────────
  await asUser("rpc/save_tryout_progress", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId, p_answers: {}, p_current_idx: 0, p_flagged: 2 }),
  });

  // ── 3. "Refresh": buka sesi lagi, penghitung harus 2 ────────────────────
  const resume = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const s2 = Array.isArray(resume.body) ? resume.body[0] : resume.body;
  check("setelah refresh: pelanggaran tidak kembali 0", Number(s2?.flagged) === 2, `flagged=${s2?.flagged}`);

  // ── 4. Penghitung tidak boleh turun walau klien kirim angka lebih kecil ──
  await asUser("rpc/save_tryout_progress", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId, p_answers: {}, p_current_idx: 0, p_flagged: 0 }),
  });

  const afterShrink = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const s3 = Array.isArray(afterShrink.body) ? afterShrink.body[0] : afterShrink.body;
  check("pelanggaran tidak bisa diturunkan dari klien", Number(s3?.flagged) === 2, `flagged=${s3?.flagged}`);

  // ── 5. Server mencatat overtime bila melewati batas ─────────────────────
  await svc(`active_tryout_sessions?user_id=eq.${userId}&tryout_id=eq.${tryoutId}`, {
    method: "PATCH",
    body: JSON.stringify({ end_time: new Date(Date.now() - 300_000).toISOString() }),
  });

  const submit = await asUser("rpc/submit_tryout_secure", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_package_id: packageId,
      p_questions_id: tryoutId,
      p_answers: {},
      p_cheat_attempts: 2,
      p_package_name: "Uji Cheat",
    }),
  });
  check("submit setelah waktu habis tetap diterima", submit.ok, `HTTP ${submit.status}`);

  const saved = await svc(`tryout_results?user_id=eq.${userId}&select=cheat_attempts`);
  check("hasil mencatat pelanggaran (2 + 1 overtime = 3)", saved.body?.[0]?.cheat_attempts === 3, `cheat=${saved.body?.[0]?.cheat_attempts}`);
} catch (err) {
  console.error("\nERROR:", err.message);
  fail++;
} finally {
  await cleanup();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
