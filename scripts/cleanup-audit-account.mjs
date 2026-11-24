// Bersihkan seluruh data uji: transaksi privat + akun audit.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync("D:/Antigravity/futurebimbelkedinasan/.env.local", "utf8")
    .split(/\r?\n/)
    .filter(l => /^[A-Z0-9_]+=/.test(l))
    .map(l => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()])
);
const svc = env.PAKASIR_SUPABASE_SERVICE_ROLE_KEY;
const base = env.VITE_SUPABASE_URL;
const H = { apikey: svc, Authorization: `Bearer ${svc}`, "Content-Type": "application/json" };

const audit = JSON.parse(readFileSync("D:/Antigravity/futurebimbelkedinasan/backups/audit-test-account.json", "utf8"));

// Hapus transaksi pending paket privat milik akun audit.
const users = [];
for (let page = 1; page <= 10; page++) {
  const res = await fetch(`${base}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: H });
  const body = await res.json();
  users.push(...(body.users ?? []));
  if ((body.users ?? []).length < 200) break;
}
const auditUser = users.find(u => u.email === audit.email);
if (!auditUser) throw new Error("akun audit tidak ditemukan");

await fetch(`${base}/rest/v1/transactions?user_id=eq.${auditUser.id}&package_id=eq.2a1e325c-a576-4624-972e-5f0c4e3e4440`, { method: "DELETE", headers: H });
await fetch(`${base}/rest/v1/tryout_results?user_id=eq.${auditUser.id}`, { method: "DELETE", headers: H });
await fetch(`${base}/rest/v1/active_tryout_sessions?user_id=eq.${auditUser.id}`, { method: "DELETE", headers: H });
await fetch(`${base}/rest/v1/user_packages?user_id=eq.${auditUser.id}`, { method: "DELETE", headers: H });
await fetch(`${base}/rest/v1/notifications?user_id=eq.${auditUser.id}`, { method: "DELETE", headers: H });
await fetch(`${base}/rest/v1/transactions?user_id=eq.${auditUser.id}`, { method: "DELETE", headers: H });
const del = await fetch(`${base}/auth/v1/admin/users/${auditUser.id}`, { method: "DELETE", headers: H });

console.log("transaksi uji + akun audit dihapus:", del.status);
