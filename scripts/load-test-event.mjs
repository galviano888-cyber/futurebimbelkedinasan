// Uji beban bertahap terhadap tryout nyata di SUPABASE PRODUKSI.
//
// Meniru perilaku ujian: peserta mengambil soal, menyimpan progres berkala,
// lalu mengirim jawaban. Tujuannya mencari titik di mana latensi atau
// kegagalan mulai naik, bukan menguji keindahan UI.
//
// Jalankan:
//   node scripts/load-test-event.mjs                 # 10,20,40,60,80 pengguna
//   node scripts/load-test-event.mjs --steps=10,30,60 --users=0  # kustom
//   node scripts/load-test-event.mjs --dry           # hanya cek koneksi
//
// Peringatan: gunakan di luar jam sibuk. Skrip menulis sesi tryout dan hasil
// uji untuk akun uji sementara, lalu menghapusnya di akhir.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);
const URL_BASE = env.VITE_SUPABASE_URL;
const SERVICE = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;
const ANON = env.VITE_SUPABASE_ANON_KEY;

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : fallback;
};
const DRY = process.argv.includes("--dry");
const STEP_LIST = String(arg("steps", "10,20,40,60,80"))
  .split(",")
  .map((n) => Number.parseInt(n, 10))
  .filter((n) => Number.isFinite(n) && n > 0)
  .sort((a, b) => a - b);

// Ambang berhenti: kalau langkah ini gagal, langkah lebih besar dilewati.
const MAX_ERROR_RATE = 0.05; // 5%
const MAX_P95_MS = 5000;

const svc = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" };

async function pickTryout() {
  // Hanya konten tryout yang benar-benar tertaut ke soal yang bisa diuji.
  const res = await fetch(
    `${URL_BASE}/rest/v1/package_contents?select=package_id,tryout_id&type=eq.tryout&tryout_id=not.is.null&limit=1`,
    { headers: svc }
  );
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows[0]?.tryout_id) {
    throw new Error(`Tidak ada tryout tertaut untuk diuji (respons: ${JSON.stringify(rows).slice(0, 160)})`);
  }
  return { tryoutId: rows[0].tryout_id, packageId: rows[0].package_id };
}

async function createUser(index, stamp) {
  const email = `loadtest.${stamp}.${index}@fbk-loadtest.dev`;
  const password = `Lt!${stamp}${index}Aa`;
  const res = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: svc,
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: `Load Test ${index}` } }),
  });
  if (!res.ok) throw new Error(`create user ${index}: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const id = body.id ?? body.user?.id;
  return { id, email, password };
}

async function signIn(user) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    if (res.ok) {
      const body = await res.json();
      return body.access_token;
    }
    const text = await res.text();
    // Supabase membatasi permintaan login (429). Tunggu lalu ulangi.
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    throw new Error(`login ${user.email}: ${res.status} ${text.slice(0, 120)}`);
  }
  throw new Error(`login ${user.email}: rate limited setelah beberapa percobaan`);
}

async function grant(packageId, userId) {
  const ins = await fetch(`${URL_BASE}/rest/v1/user_packages`, {
    method: "POST",
    headers: { ...svc, Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ user_id: userId, package_id: packageId, activated_at: new Date().toISOString() }),
  });
  if (!ins.ok) throw new Error(`grant ${userId}: ${ins.status} ${await ins.text()}`);
}

const now = () => performance.now();
const pct = (arr, p) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]);
};

async function timed(label, fn, latencies, errors) {
  const t0 = now();
  try {
    await fn();
    latencies.push(now() - t0);
  } catch (err) {
    errors.push(`${label}: ${String(err.message ?? err).slice(0, 120)}`);
  }
}

async function runUser(token, tryoutId, answers, latencies, errors) {
  const auth = { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const rpc = async (name, body) => {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${name} ${res.status} ${text.slice(0, 120)}`);
    // Sebagian fungsi mengembalikan 204 tanpa body; itu sukses, bukan error.
    return text ? JSON.parse(text) : null;
  };

  // Urutan penting: sesi harus ada dulu sebelum progres bisa disimpan,
  // sama seperti perilaku aplikasi sungguhan.
  await timed("start_tryout_session", () => rpc("start_tryout_session", { p_tryout_id: tryoutId }), latencies, errors);

  await Promise.all([
    timed("get_exam_questions", () => rpc("get_exam_questions", { p_tryout_id: tryoutId }), latencies, errors),
    timed("count_active_participants", () => rpc("count_active_tryout_participants", { p_tryout_id: tryoutId }), latencies, errors),
    timed(
      "save_tryout_progress",
      () => rpc("save_tryout_progress", { p_tryout_id: tryoutId, p_answers: answers, p_current_idx: 3, p_flagged: 0 }),
      latencies,
      errors
    ),
  ]);
}

async function cleanup(users, tryoutId) {
  for (const user of users) {
    await fetch(`${URL_BASE}/rest/v1/tryout_results?user_id=eq.${user.id}`, { method: "DELETE", headers: svc });
    await fetch(`${URL_BASE}/rest/v1/active_tryout_sessions?user_id=eq.${user.id}`, { method: "DELETE", headers: svc });
    await fetch(`${URL_BASE}/rest/v1/user_packages?user_id=eq.${user.id}`, { method: "DELETE", headers: svc });
    await fetch(`${URL_BASE}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
    });
  }
}

const { tryoutId, packageId } = await pickTryout();
console.log(`Tryout uji: ${tryoutId}`);

if (DRY) {
  const t0 = now();
  const res = await fetch(`${URL_BASE}/rest/v1/tryout_questions?select=id&limit=1`, { headers: svc });
  console.log(`Koneksi ${res.status} dalam ${Math.round(now() - t0)} ms — mode dry, tidak ada beban dijalankan.`);
  process.exit(0);
}

const stamp = Date.now();
const allUsers = [];
const rows = [];

for (const count of STEP_LIST) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createUser(`${stamp}_${count}_${i}`, stamp);
    users.push(user);
    allUsers.push(user);
  }
  const tokens = [];
  for (const user of users) {
    await grant(packageId, user.id);
    tokens.push(await signIn(user));
    await new Promise((r) => setTimeout(r, 120));
  }

  const latencies = [];
  const errors = [];
  const answers = { q1: "A", q2: "B", q3: "C" };
  const t0 = now();
  await Promise.all(tokens.map((token) => runUser(token, tryoutId, answers, latencies, errors)));
  const totalMs = now() - t0;

  const errorRate = errors.length / Math.max(1, latencies.length + errors.length);
  const row = {
    concurrent: count,
    requests: latencies.length + errors.length,
    errors: errors.length,
    errorRate: `${(errorRate * 100).toFixed(1)}%`,
    p50: pct(latencies, 50),
    p95: pct(latencies, 95),
    totalMs: Math.round(totalMs),
  };
  rows.push(row);
  console.log(JSON.stringify(row));
  if (errors.length) console.log("  contoh error:", errors.slice(0, 3).join(" | "));
  if (errorRate > MAX_ERROR_RATE || pct(latencies, 95) > MAX_P95_MS) {
    console.log(`\nBerhenti di ${count} pengguna: error ${row.errorRate} atau p95 ${row.p95} ms melewati ambang.`);
    break;
  }
}

await cleanup(allUsers, tryoutId);
console.log("\nRingkasan (semua panggilan RPC, milidetik):");
console.table(rows);
console.log(`Data uji ${allUsers.length} akun sudah dihapus.`);
