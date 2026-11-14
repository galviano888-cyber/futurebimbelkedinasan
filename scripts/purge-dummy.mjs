// Hapus profil dummy (data contoh) beserta hasil tryout-nya.
//
// Kriteria dummy: id berawalan "00000001-" ATAU email berakhiran "@fbk.dev".
// Pengaman: skrip BERHENTI bila ada dummy yang punya user_packages atau
// transactions, karena itu berarti data nyata.
//
// Jalankan: node scripts/purge-dummy.mjs --apply
// Tanpa --apply hanya menampilkan rencana (dry run).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const apply = process.argv.includes("--apply");

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);

const url = env.VITE_SUPABASE_URL;
const key = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const get = async (p) => (await fetch(`${url}/rest/v1/${p}`, { headers: H })).json();

const isDummy = (p) =>
  /^0000000/i.test(p.id) || /@fbk\.dev$/i.test(p.email ?? "");

const profiles = await get("profiles?select=id,email,full_name,student_code");
const dummy = profiles.filter(isDummy);
const ids = dummy.map((d) => d.id);
const idSet = new Set(ids);

if (ids.length === 0) {
  console.log("Tidak ada profil dummy. Selesai.");
  process.exit(0);
}

const userPackages = await get("user_packages?select=user_id,package_id");
const transactions = await get("transactions?select=user_id,status,amount");
const results = await get("tryout_results?select=id,user_id");

const ownedAccess = userPackages.filter((x) => idSet.has(x.user_id));
const ownedTx = transactions.filter((x) => idSet.has(x.user_id));
const ownedResults = results.filter((x) => idSet.has(x.user_id));

console.log(`Profil dummy        : ${ids.length}`);
console.log(`  hasil tryout      : ${ownedResults.length}`);
console.log(`  akses paket       : ${ownedAccess.length}`);
console.log(`  transaksi         : ${ownedTx.length}`);

if (ownedAccess.length > 0 || ownedTx.length > 0) {
  console.error("\nBERHENTI: ada dummy dengan akses paket / transaksi. Periksa manual.");
  process.exit(1);
}

if (!apply) {
  console.log("\nDRY RUN. Tambahkan --apply untuk benar-benar menghapus.");
  console.log("Contoh 5 profil yang akan dihapus:");
  for (const d of dummy.slice(0, 5)) {
    console.log(`  ${d.student_code ?? "-"}  ${d.full_name}  ${d.email}`);
  }
  process.exit(0);
}

// Hapus hasil tryout milik dummy.
if (ownedResults.length > 0) {
  const res = await fetch(`${url}/rest/v1/tryout_results?user_id=in.(${ids.join(",")})`, {
    method: "DELETE",
    headers: H,
  });
  if (!res.ok) {
    console.error(`Gagal hapus tryout_results: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`\nDihapus: ${ownedResults.length} hasil tryout`);
}

// Hapus profil dummy.
const delRes = await fetch(`${url}/rest/v1/profiles?id=in.(${ids.join(",")})`, {
  method: "DELETE",
  headers: H,
});
if (!delRes.ok) {
  console.error(`Gagal hapus profiles: ${delRes.status} ${await delRes.text()}`);
  process.exit(1);
}
console.log(`Dihapus: ${ids.length} profil dummy`);

// Verifikasi.
const after = await get("profiles?select=id,email");
const remaining = after.filter(isDummy).length;
const resultsAfter = await get("tryout_results?select=id");
console.log(`\nSisa profil dummy   : ${remaining}`);
console.log(`Sisa profil total   : ${after.length}`);
console.log(`Sisa hasil tryout   : ${resultsAfter.length}`);

if (remaining !== 0) {
  console.error("PERINGATAN: masih ada profil dummy tersisa.");
  process.exit(1);
}
console.log("\nSelesai.");
