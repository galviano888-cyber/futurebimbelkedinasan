// Membuat migrasi restore dari file backup JSON.
// Dipakai satu kali untuk mengembalikan data yang hilang akibat cascade delete.
//
// Jalankan: node scripts/generate-restore.mjs <folder-backup>

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node scripts/generate-restore.mjs <folder-backup>");
  process.exit(1);
}

const rows = (table) =>
  JSON.parse(readFileSync(resolve(ROOT, dir, `${table}.json`), "utf8"));

function lit(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function inserts(table, data) {
  return data.map((r) => {
    const cols = Object.keys(r);
    return `insert into public.${table} (${cols.join(", ")})\nvalues (${cols
      .map((c) => lit(r[c]))
      .join(", ")})\non conflict (id) do nothing;`;
  });
}

const pkgs = rows("packages");
const contents = rows("package_contents");
const ups = rows("user_packages");

const out = [];
out.push("-- Restore data paket yang hilang akibat cascade delete.");
out.push("-- Sumber: " + dir);
out.push("-- Trigger kuota & penjualan dimatikan sementara agar data lama");
out.push("-- tidak memicu penjualan baru atau tertolak kuota.");
out.push("");
out.push("begin;");
out.push("");
out.push("alter table public.user_packages disable trigger trg_close_fulfilled_requests;");
out.push("alter table public.user_packages disable trigger trg_enforce_package_quota;");
out.push("");
out.push(`-- packages (${pkgs.length})`);
out.push(...inserts("packages", pkgs));
out.push("");
out.push(`-- package_contents (${contents.length})`);
out.push(...inserts("package_contents", contents));
out.push("");
out.push(`-- user_packages (${ups.length})`);
out.push(...inserts("user_packages", ups));
out.push("");
out.push("alter table public.user_packages enable trigger trg_close_fulfilled_requests;");
out.push("alter table public.user_packages enable trigger trg_enforce_package_quota;");
out.push("");
out.push("-- seats_taken disamakan dengan jumlah akses sebenarnya.");
out.push("update public.packages p");
out.push("set seats_taken = coalesce(sub.cnt, 0)");
out.push("from (");
out.push("  select package_id, count(*)::int as cnt");
out.push("  from public.user_packages group by package_id");
out.push(") sub");
out.push("where p.id = sub.package_id;");
out.push("");
out.push("notify pgrst, 'reload schema';");
out.push("");
out.push("commit;");

const target = resolve(ROOT, "supabase/migrations/20261114182000_restore_packages_data.sql");
writeFileSync(target, out.join("\n") + "\n", "utf8");

console.log(`packages        ${pkgs.length}`);
console.log(`package_contents ${contents.length}`);
console.log(`user_packages   ${ups.length}`);
console.log(`ditulis ke ${target}`);
