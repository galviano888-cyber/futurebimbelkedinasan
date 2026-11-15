// Uji pemulihan sesi tryout: jawaban dan posisi soal tersimpan di server,
// lalu bisa dilanjutkan setelah "koneksi putus".
//
// Jalankan: node scripts/e2e-session.mjs

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
const email = `session-${stamp}@fbk-e2e.dev`;
const password = `Se!${stamp}Aa`;

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
    await svc(`transactions?package_id=eq.${packageId}`, { method: "DELETE" });
    await svc(`user_packages?package_id=eq.${packageId}`, { method: "DELETE" });
    await svc(`package_contents?package_id=eq.${packageId}`, { method: "DELETE" });
    await svc(`packages?id=eq.${packageId}`, { method: "DELETE" });
  }
  if (userId) {
    await fetch(`${url}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
  }
}

try {
  // User + paket + tryout + soal.
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
    body: JSON.stringify({ title: `__sess_${stamp}__`, price: 0, product_type: "SATUAN", sales_status: "OPEN" }),
  });
  packageId = pkg.body[0].id;

  const tp = await svc("tryout_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=representation" },
    body: JSON.stringify({ name: `__sess_to_${stamp}__`, duration_minutes: 100, status: "Published" }),
  });
  if (!tp.ok) throw new Error(`buat tryout: ${JSON.stringify(tp.body)}`);
  tryoutId = tp.body[0].id;

  // Dua soal sederhana.
  await svc("tryout_questions", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify([
      {
        package_id: tryoutId,
        number: 1,
        category: "TWK",
        question_text: "Soal uji satu",
        options: { A: "a", B: "b", C: "c", D: "d", E: "e" },
        correct_answer: "A",
        explanation: "uji",
      },
      {
        package_id: tryoutId,
        number: 2,
        category: "TWK",
        question_text: "Soal uji dua",
        options: { A: "a", B: "b", C: "c", D: "d", E: "e" },
        correct_answer: "B",
        explanation: "uji",
      },
    ]),
  });

  // Hubungkan tryout ke paket + beri akses.
  await svc("package_contents", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({ package_id: packageId, type: "tryout", title: "Tryout uji", tryout_id: tryoutId, order_index: 1 }),
  });
  await svc("user_packages", {
    method: "POST",
    headers: { ...S, Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: userId, package_id: packageId }),
  });

  // ── 1. Mulai sesi ───────────────────────────────────────────────────────
  const start = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  check("sesi ujian bisa dimulai", start.ok, JSON.stringify(start.body));

  const s1 = Array.isArray(start.body) ? start.body[0] : start.body;
  check("jawaban awal kosong", Object.keys(s1?.answers ?? {}).length === 0, JSON.stringify(s1?.answers));
  check("posisi awal soal 0", Number(s1?.current_idx ?? 0) === 0, String(s1?.current_idx));
  check("tidak dianggap kedaluwarsa", s1?.expired === false, String(s1?.expired));

  const endTime1 = new Date(s1.end_time).getTime();
  check(
    "batas waktu ±100 menit",
    Math.abs(endTime1 - Date.now() - 100 * 60_000) < 60_000,
    `${Math.round((endTime1 - Date.now()) / 60_000)} menit`
  );

  // ── 2. Simpan progres (seperti autosave saat menjawab) ──────────────────
  const save = await asUser("rpc/save_tryout_progress", {
    method: "POST",
    body: JSON.stringify({
      p_tryout_id: tryoutId,
      p_answers: { q1: "A" },
      p_current_idx: 1,
      p_flagged: 0,
    }),
  });
  check("progres tersimpan", save.ok, JSON.stringify(save.body));

  // ── 3. "Koneksi putus": buka sesi lagi ──────────────────────────────────
  const resume = await asUser("rpc/start_tryout_session", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const s2 = Array.isArray(resume.body) ? resume.body[0] : resume.body;

  check("jawaban dipulihkan", s2?.answers?.q1 === "A", JSON.stringify(s2?.answers));
  check("posisi soal dipulihkan ke 1", Number(s2?.current_idx) === 1, String(s2?.current_idx));
  check(
    "batas waktu TIDAK direset",
    Math.abs(new Date(s2.end_time).getTime() - endTime1) < 2000,
    `${endTime1} vs ${new Date(s2.end_time).getTime()}`
  );
  check("sesi tidak dobel", (await svc(`active_tryout_sessions?user_id=eq.${userId}&tryout_id=eq.${tryoutId}`)).body?.length === 1, "");

  // ── 4. Tidak ada kunci jawaban di soal ujian ────────────────────────────
  const exam = await asUser("rpc/get_exam_questions", {
    method: "POST",
    body: JSON.stringify({ p_tryout_id: tryoutId }),
  });
  const firstQ = Array.isArray(exam.body) ? exam.body[0] : null;
  const leaksKey =
    firstQ && ("correct_answer" in firstQ || "explanation" in firstQ);
  check("kunci jawaban tidak bocor ke siswa", !leaksKey, Object.keys(firstQ ?? {}).join(","));

  // ── 5. Siswa lain tidak bisa menyentuh sesi ini ─────────────────────────
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

  const otherRead = await fetch(`${url}/rest/v1/active_tryout_sessions?select=*`, {
    headers: { apikey: anon, Authorization: `Bearer ${otherToken}` },
  });
  let otherRows = [];
  try {
    otherRows = await otherRead.json();
  } catch {
    /* ignore */
  }
  check(
    "siswa lain tidak bisa melihat sesi ini",
    !otherRead.ok || (Array.isArray(otherRows) && otherRows.length === 0),
    `HTTP ${otherRead.status}`
  );

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
