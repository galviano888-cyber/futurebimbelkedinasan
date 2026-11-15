// Uji batas akses tryout: siswa tanpa paket tidak boleh membaca soal,
// memulai sesi, atau mengirim hasil.
//
// Jalankan: node scripts/e2e-access.mjs

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
const email = `access-${stamp}@fbk-e2e.dev`;
const password = `Ac!${stamp}Aa`;

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

  // Paket + tryout yang TIDAK diberikan ke siswa ini.
  const pkg = await svc("packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ title: `__acc_${stamp}__`, price: 1000, product_type: "SATUAN", sales_status: "OPEN" }),
  });
  packageId = pkg.body[0].id;

  const tp = await svc("tryout_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ name: `__acc_to_${stamp}__`, duration_minutes: 100, status: "Published" }),
  });
  tryoutId = tp.body[0].id;

  await svc("tryout_questions", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({
      package_id: tryoutId,
      number: 1,
      category: "TWK",
      question_text: "Rahasia",
      options: { A: "a", B: "b", C: "c", D: "d", E: "e" },
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

  // Tanpa user_packages: semua harus ditolak.
  const questions = await asUser("rpc/get_exam_questions", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const gotQuestions = Array.isArray(questions.body) ? questions.body.length : -1;
  check("tanpa paket: soal tidak bisa dibaca", !questions.ok || gotQuestions === 0, `rows=${gotQuestions} HTTP=${questions.status}`);

  const session = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  check("tanpa paket: sesi tidak bisa dimulai", !session.ok, `HTTP ${session.status}`);

  const submit = await asUser("rpc/submit_tryout_secure", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_package_id: packageId,
      p_questions_id: tryoutId,
      p_answers: {},
      p_cheat_attempts: 0,
      p_package_name: "x",
    }),
  });
  check("tanpa paket: hasil tidak bisa dikirim", !submit.ok, `HTTP ${submit.status}`);

  // Setelah paket diberikan, akses terbuka.
  await svc("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: userId, package_id: packageId }),
  });

  const questions2 = await asUser("rpc/get_exam_questions", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const got2 = Array.isArray(questions2.body) ? questions2.body.length : 0;
  check("dengan paket: soal bisa dibaca", questions2.ok && got2 === 1, `rows=${got2}`);
  check(
    "soal tidak memuat kunci jawaban",
    !questions2.body?.[0] || !("correct_answer" in questions2.body[0]),
    Object.keys(questions2.body?.[0] ?? {}).join(",")
  );

  const session2 = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  check("dengan paket: sesi bisa dimulai", session2.ok, JSON.stringify(session2.body));

  // Cabut akses: sesi yang sedang berjalan tidak boleh lanjut menyimpan progres.
  await svc(`user_packages?user_id=eq.${userId}&package_id=eq.${packageId}`, { method: "DELETE" });

  const afterRevoke = await asUser("rpc/save_tryout_progress", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId, p_answers: {}, p_current_idx: 0, p_flagged: 0 }),
  });
  check(
    "setelah akses dicabut: progres masih bisa disimpan untuk sesi berjalan",
    afterRevoke.ok,
    `HTTP ${afterRevoke.status}`
  );

  const submit2 = await asUser("rpc/submit_tryout_secure", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_package_id: packageId,
      p_questions_id: tryoutId,
      p_answers: {},
      p_cheat_attempts: 0,
      p_package_name: "x",
    }),
  });
  check("setelah akses dicabut: hasil tidak bisa dikirim", !submit2.ok, `HTTP ${submit2.status}`);
} catch (err) {
  console.error("\nERROR:", err.message);
  fail++;
} finally {
  await cleanup();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
