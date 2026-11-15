// Uji pengiriman tryout end-to-end: hitung skor TWK/TIU/TKP, simpan hasil,
// hapus sesi, dan tolak pengiriman ganda.
//
// Jalankan: node scripts/e2e-submit.mjs

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
const email = `submit-${stamp}@fbk-e2e.dev`;
const password = `Su!${stamp}Aa`;

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
let questionIds = [];

async function cleanup() {
  if (tryoutId) {
    await svc(`active_tryout_sessions?tryout_id=eq.${tryoutId}`, { method: "DELETE" });
    await svc(`tryout_questions?package_id=eq.${tryoutId}`, { method: "DELETE" });
    await svc(`tryout_packages?id=eq.${tryoutId}`, { method: "DELETE" });
  }
  if (packageId) {
    await svc(`transactions?package_id=eq.${packageId}`, { method: "DELETE" });
    await svc(`user_packages?package_id=eq.${packageId}`, { method: "DELETE" });
    await svc(`package_contents?package_id=eq.${packageId}`, { method: "DELETE" });
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
  // ── Siapkan data ────────────────────────────────────────────────────────
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
    body: JSON.stringify({ title: `__sub_${stamp}__`, price: 0, product_type: "SATUAN", sales_status: "OPEN" }),
  });
  packageId = pkg.body[0].id;

  const tp = await svc("tryout_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({
      name: `__sub_to_${stamp}__`,
      duration_minutes: 100,
      status: "Published",
      passing_grade_twk: 65,
      passing_grade_tiu: 80,
      passing_grade_tkp: 166,
    }),
  });
  if (!tp.ok) throw new Error(JSON.stringify(tp.body));
  tryoutId = tp.body[0].id;

  // 3 soal: 2 TWK (benar/salah), 1 TKP dengan skor bertingkat.
  // Semua objek wajib punya kunci yang sama untuk insert massal PostgREST.
  const qs = [
    {
      package_id: tryoutId,
      number: 1,
      category: "TWK",
      question_text: "TWK benar",
      options: { A: "a", B: "b", C: "c", D: "d", E: "e" },
      correct_answer: "A",
      tkp_scores: null,
      explanation: "x",
    },
    {
      package_id: tryoutId,
      number: 2,
      category: "TIU",
      question_text: "TIU salah",
      options: { A: "a", B: "b", C: "c", D: "d", E: "e" },
      correct_answer: "B",
      tkp_scores: null,
      explanation: "x",
    },
    {
      package_id: tryoutId,
      number: 3,
      category: "TKP",
      question_text: "TKP skor 4",
      options: { A: "a", B: "b", C: "c", D: "d", E: "e" },
      correct_answer: "A",
      tkp_scores: { A: 4, B: 3, C: 2, D: 1, E: 5 },
      explanation: "x",
    },
  ];
  const inserted = await svc("tryout_questions", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify(qs),
  });
  if (!inserted.ok) throw new Error(JSON.stringify(inserted.body));
  questionIds = inserted.body.map((q) => q.id);

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

  // ── Mulai sesi ──────────────────────────────────────────────────────────
  const start = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  check("sesi dimulai", start.ok, JSON.stringify(start.body));

  // ── Kirim jawaban ───────────────────────────────────────────────────────
  // TWK #1 benar (A) = 5, TIU #2 salah (pilih C, kunci B) = 0, TKP #3 pilih A = 4
  const answers = {};
  answers[questionIds[0]] = "A";
  answers[questionIds[1]] = "C";
  answers[questionIds[2]] = "A";

  const submit = await asUser("rpc/submit_tryout_secure", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_package_id: packageId,
      p_questions_id: tryoutId,
      p_answers: answers,
      p_cheat_attempts: 0,
      p_package_name: "Uji Submit",
    }),
  });
  check("tryout bisa dikirim", submit.ok, JSON.stringify(submit.body).slice(0, 300));

  if (submit.ok) {
    const res = Array.isArray(submit.body) ? submit.body[0] : submit.body;
    check("skor TWK = 5", res?.twk === 5, `twk=${res?.twk}`);
    check("skor TIU = 0", res?.tiu === 0, `tiu=${res?.tiu}`);
    check("skor TKP = 4", res?.tkp === 4, `tkp=${res?.tkp}`);
    check("total = 9", res?.total === 9, `total=${res?.total}`);
    check("TWK benar = 1", res?.twk_correct === 1, `twk_correct=${res?.twk_correct}`);
    check("TIU benar = 0", res?.tiu_correct === 0, `tiu_correct=${res?.tiu_correct}`);

    // Hasil tercatat
    const saved = await svc(`tryout_results?user_id=eq.${userId}&tryout_id=eq.${tryoutId}&select=id,total,twk,tiu,tkp`);
    check("hasil tersimpan di database", saved.body?.length === 1, JSON.stringify(saved.body));
    check("total tersimpan = 9", saved.body?.[0]?.total === 9, JSON.stringify(saved.body?.[0]));

    // Sesi dibersihkan
    const sess = await svc(`active_tryout_sessions?user_id=eq.${userId}&tryout_id=eq.${tryoutId}`);
    check("sesi dihapus setelah submit", sess.body?.length === 0, `rows=${sess.body?.length}`);

    // Kirim ulang tidak boleh membuat hasil ganda
    const again = await asUser("rpc/submit_tryout_secure", {
      method: "POST",
      body: JSON.stringify({
        p_user_id: userId,
        p_package_id: packageId,
        p_questions_id: tryoutId,
        p_answers: answers,
        p_cheat_attempts: 0,
        p_package_name: "Uji Submit",
      }),
    });
    const countAfter = await svc(`tryout_results?user_id=eq.${userId}&tryout_id=eq.${tryoutId}`);
    check(
      "kirim ulang tidak membuat hasil ganda",
      countAfter.body?.length === 1,
      `rows=${countAfter.body?.length} status=${again.status}`
    );
  }

  // ── Tidak bisa submit atas nama siswa lain ──────────────────────────────
  const otherEmail = `other-${stamp}@fbk-e2e.dev`;
  const other = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: S,
    body: JSON.stringify({ email: otherEmail, password, email_confirm: true }),
  });
  const otherId = (await other.json()).id;
  const otherToken = (
    await (
      await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: anon, "Content-Type": "application/json" },
        body: JSON.stringify({ email: otherEmail, password }),
      })
    ).json()
  ).access_token;

  const impersonate = await fetch(`${url}/rest/v1/rpc/submit_tryout_secure`, {
    method: "POST",
    headers: { apikey: anon, Authorization: `Bearer ${otherToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_user_id: userId,
      p_package_id: packageId,
      p_questions_id: tryoutId,
      p_answers: answers,
      p_cheat_attempts: 0,
      p_package_name: "Uji Submit",
    }),
  });
  check("siswa lain tidak bisa submit atas nama orang", !impersonate.ok, `HTTP ${impersonate.status}`);

  await fetch(`${url}/auth/v1/admin/users/${otherId}`, {
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
