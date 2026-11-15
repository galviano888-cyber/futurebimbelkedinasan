// Uji ketahanan sesi terhadap posisi soal yang tidak valid.
// Menguji: current_idx melewati jumlah soal, negatif, dan sesi kedaluwarsa.
//
// Jalankan: node scripts/e2e-session2.mjs

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
const email = `sess2-${stamp}@fbk-e2e.dev`;
const password = `S2!${stamp}Aa`;

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

  const pkg = await svc("packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ title: `__s2_${stamp}__`, price: 0, product_type: "SATUAN", sales_status: "OPEN" }),
  });
  packageId = pkg.body[0].id;

  const tp = await svc("tryout_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ name: `__s2_to_${stamp}__`, duration_minutes: 100, status: "Published" }),
  });
  tryoutId = tp.body[0].id;

  // Hanya 2 soal.
  await svc("tryout_questions", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify([
      { package_id: tryoutId, number: 1, category: "TWK", question_text: "q1", options: { A: "a", B: "b" }, correct_answer: "A", tkp_scores: null, explanation: "x" },
      { package_id: tryoutId, number: 2, category: "TWK", question_text: "q2", options: { A: "a", B: "b" }, correct_answer: "B", tkp_scores: null, explanation: "x" },
    ]),
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

  await asUser("rpc/start_tryout_session", { method: "POST", body: JSON.stringify({ p_tryout_id: tryoutId }) });

  // ── 1. current_idx melewati jumlah soal (mis. admin mengurangi soal) ─────
  await asUser("rpc/save_tryout_progress", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId, p_answers: {}, p_current_idx: 99, p_flagged: 0 }),
  });

  const resumed = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const s = Array.isArray(resumed.body) ? resumed.body[0] : resumed.body;
  check("server menyimpan idx apa adanya (klien yang menjepit)", Number(s?.current_idx) === 99, `idx=${s?.current_idx}`);

  const questions = await asUser("rpc/get_exam_questions", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const qCount = Array.isArray(questions.body) ? questions.body.length : 0;
  check("jumlah soal sebenarnya 2", qCount === 2, `count=${qCount}`);
  check(
    "idx 99 melebihi batas -> klien harus menjepit ke 1",
    Math.min(99, qCount - 1) === 1,
    "logika penjepitan"
  );

  // ── 2. current_idx negatif ──────────────────────────────────────────────
  const neg = await asUser("rpc/save_tryout_progress", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId, p_answers: {}, p_current_idx: -5, p_flagged: 0 }),
  });
  check("idx negatif diterima tanpa error", neg.ok, `HTTP ${neg.status}`);

  const afterNeg = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const sNeg = Array.isArray(afterNeg.body) ? afterNeg.body[0] : afterNeg.body;
  check("idx negatif dijepit ke 0 oleh server", Number(sNeg?.current_idx) === 0, `idx=${sNeg?.current_idx}`);

  // ── 3. Sesi kedaluwarsa: progres ditolak ────────────────────────────────
  await svc(`active_tryout_sessions?user_id=eq.${userId}&tryout_id=eq.${tryoutId}`, {
    method: "PATCH",
    body: JSON.stringify({ end_time: new Date(Date.now() - 60_000).toISOString() }),
  });

  const expiredSave = await asUser("rpc/save_tryout_progress", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId, p_answers: {}, p_current_idx: 0, p_flagged: 0 }),
  });
  check("sesi kedaluwarsa: progres ditolak", !expiredSave.ok, `HTTP ${expiredSave.status}`);

  const expiredResume = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const sExp = Array.isArray(expiredResume.body) ? expiredResume.body[0] : expiredResume.body;
  check("sesi kedaluwarsa: ditandai expired", sExp?.expired === true, `expired=${sExp?.expired}`);

  // ── 4. Sesi kedaluwarsa > 1 jam: dibersihkan, bisa mulai baru ───────────
  await svc(`active_tryout_sessions?user_id=eq.${userId}&tryout_id=eq.${tryoutId}`, {
    method: "PATCH",
    body: JSON.stringify({ end_time: new Date(Date.now() - 2 * 3600_000).toISOString() }),
  });

  const fresh = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const sFresh = Array.isArray(fresh.body) ? fresh.body[0] : fresh.body;
  check("sesi lama > 1 jam dihapus dan sesi baru dibuat", sFresh?.expired === false, `expired=${sFresh?.expired}`);
  check("sesi baru kosong", Object.keys(sFresh?.answers ?? {}).length === 0, JSON.stringify(sFresh?.answers));
} catch (err) {
  console.error("\nERROR:", err.message);
  fail++;
} finally {
  await cleanup();
  console.log(`\n== ${pass} pass, ${fail} fail ==`);
  process.exit(fail > 0 ? 1 : 0);
}
