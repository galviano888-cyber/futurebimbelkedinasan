// Menyiapkan data simulasi siswa: paket berbayar, tryout dengan 10 soal nyata,
// dan satu akun siswa percobaan. Hasilnya dicetak sebagai JSON untuk dipakai
// skrip simulasi browser.
//
// Jalankan: node scripts/prepare-student-sim.mjs
// Bersihkan: node scripts/prepare-student-sim.mjs --cleanup

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);

const url = env.VITE_SUPABASE_URL;
const service = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;
const S = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };

const stateFile = resolve(ROOT, ".sim-state.json");

async function rest(path, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: S, ...init });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

async function cleanup(state) {
  if (!state) {
    try {
      state = JSON.parse(readFileSync(stateFile, "utf8"));
    } catch {
      console.log("Tidak ada state untuk dibersihkan.");
      return;
    }
  }

  if (state.packageId) {
    await rest(`tryout_questions?package_id=eq.${state.tryoutId}`, { method: "DELETE" });
    await rest(`tryout_packages?id=eq.${state.tryoutId}`, { method: "DELETE" });
    await rest(`package_contents?package_id=eq.${state.packageId}`, { method: "DELETE" });
    await rest(`user_packages?package_id=eq.${state.packageId}`, { method: "DELETE" });
    await rest(`transactions?package_id=eq.${state.packageId}`, { method: "DELETE" });
    await rest(`packages?id=eq.${state.packageId}`, { method: "DELETE" });
  }
  if (state.userId) {
    await rest(`tryout_results?user_id=eq.${state.userId}`, { method: "DELETE" });
    await rest(`notifications?user_id=eq.${state.userId}`, { method: "DELETE" });
    await fetch(`${url}/auth/v1/admin/users/${state.userId}`, {
      method: "DELETE",
      headers: { apikey: service, Authorization: `Bearer ${service}` },
    });
  }

  console.log("Data simulasi dibersihkan.");
}

if (process.argv.includes("--cleanup")) {
  await cleanup(null);
  process.exit(0);
}

// ── Bersihkan sisa percobaan sebelumnya ──────────────────────────────────
try {
  const prev = JSON.parse(readFileSync(stateFile, "utf8"));
  await cleanup(prev);
} catch {
  /* belum ada */
}

const stamp = Date.now();

// ── Akun siswa ───────────────────────────────────────────────────────────
const email = `siswa.sim.${stamp}@fbk-sim.dev`;
const password = `Sim!${stamp}Aa`;
const created = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: S,
  body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: "Siswa Simulasi" } }),
});
if (!created.ok) throw new Error(await created.text());
const createdUser = await created.json();
const userId = createdUser.id ?? createdUser.user?.id;

// ── Paket berbayar ───────────────────────────────────────────────────────
const pkg = await rest("packages", {
  method: "POST",
  headers: { ...S, Prefer: "return=representation" },
  body: JSON.stringify({
    title: `Simulasi SKD ${stamp}`,
    description: "Paket uji simulasi siswa.",
    price: 49000,
    product_type: "SATUAN",
    sales_status: "OPEN",
  }),
});
if (!pkg.ok) throw new Error(JSON.stringify(pkg.body));
const packageId = pkg.body[0].id;

// ── Tryout + 10 soal ─────────────────────────────────────────────────────
const tp = await rest("tryout_packages", {
  method: "POST",
  headers: { ...S, Prefer: "return=representation" },
  body: JSON.stringify({
    name: `Simulasi Tryout ${stamp}`,
    duration_minutes: 30,
    status: "Published",
    passing_grade_twk: 65,
    passing_grade_tiu: 80,
    passing_grade_tkp: 166,
  }),
});
if (!tp.ok) throw new Error(JSON.stringify(tp.body));
const tryoutId = tp.body[0].id;

const questions = [];
for (let i = 1; i <= 4; i++) {
  questions.push({
    package_id: tryoutId,
    number: i,
    category: "TWK",
    sub_category: "Nasionalisme",
    question_text: `Soal TWK nomor ${i}: manakah pernyataan yang paling tepat?`,
    options: { A: "Pilihan A", B: "Pilihan B", C: "Pilihan C", D: "Pilihan D", E: "Pilihan E" },
    correct_answer: "A",
    tkp_scores: null,
    explanation: `Penjelasan TWK ${i}: jawaban yang benar adalah A.`,
    fast_tips: "Baca kata kunci pada pernyataan.",
  });
}
for (let i = 5; i <= 7; i++) {
  questions.push({
    package_id: tryoutId,
    number: i,
    category: "TIU",
    sub_category: "Deret Angka",
    question_text: `Soal TIU nomor ${i}: lanjutkan deret berikut.`,
    options: { A: "Pilihan A", B: "Pilihan B", C: "Pilihan C", D: "Pilihan D", E: "Pilihan E" },
    correct_answer: "B",
    tkp_scores: null,
    explanation: `Penjelasan TIU ${i}: jawaban yang benar adalah B.`,
    fast_tips: "Cari pola selisih.",
  });
}
for (let i = 8; i <= 10; i++) {
  questions.push({
    package_id: tryoutId,
    number: i,
    category: "TKP",
    sub_category: "Pelayanan Publik",
    question_text: `Soal TKP nomor ${i}: apa yang akan Anda lakukan?`,
    options: { A: "Pilihan A", B: "Pilihan B", C: "Pilihan C", D: "Pilihan D", E: "Pilihan E" },
    correct_answer: "E",
    tkp_scores: { A: 1, B: 2, C: 3, D: 4, E: 5 },
    explanation: `Penjelasan TKP ${i}: skor tertinggi pada pilihan E.`,
    fast_tips: "Pilih yang paling solutif.",
  });
}

const qRes = await rest("tryout_questions", {
  method: "POST",
  headers: { ...S, Prefer: "return=minimal" },
  body: JSON.stringify(questions),
});
if (!qRes.ok) throw new Error(JSON.stringify(qRes.body));

await rest("package_contents", {
  method: "POST",
  headers: { ...S, Prefer: "return=minimal" },
  body: JSON.stringify({
    package_id: packageId,
    type: "tryout",
    title: "Tryout Simulasi",
    tryout_id: tryoutId,
    order_index: 1,
  }),
});

const state = { userId, email, password, packageId, tryoutId, stamp };
writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");

console.log(JSON.stringify(state, null, 2));
