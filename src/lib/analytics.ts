// Pencatatan event funnel penjualan, tanpa layanan pihak ketiga.
//
// Setiap pengunjung (termasuk yang belum login) punya session_id di
// localStorage, sehingga jumlah orang bisa dihitung tanpa cookie pihak ketiga.
//
// Semua fungsi aman dipanggil kapan saja: kegagalan pencatatan tidak boleh
// mengganggu pengalaman pengguna.

import { supabase } from "@/lib/supabaseClient";

export type AnalyticsEvent =
  | "view_landing"
  | "view_pricing"
  | "view_paket"
  | "click_wa"
  | "request_created"
  | "free_claimed";

const SESSION_KEY = "fbk_analytics_session";

/** ID sesi peramban. Dibuat sekali, dipakai ulang. */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

/** Catat satu event. Tidak pernah melempar error. */
export async function track(
  name: AnalyticsEvent,
  meta: Record<string, unknown> = {}
): Promise<void> {
  if (!supabase) return;

  try {
    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user?.id ?? null;
    } catch {
      /* anonim */
    }

    await supabase.from("analytics_events").insert({
      name,
      session_id: getSessionId(),
      user_id: userId,
      path: typeof window !== "undefined" ? window.location.pathname : null,
      meta,
    });
  } catch {
    /* pencatatan tidak boleh mengganggu UI */
  }
}

/** Catat event sekali per sesi peramban, mis. kunjungan halaman. */
const SEEN_PREFIX = "fbk_seen_";

export function trackOnce(name: AnalyticsEvent, meta: Record<string, unknown> = {}) {
  try {
    const key = `${SEEN_PREFIX}${name}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* lanjutkan saja */
  }
  void track(name, meta);
}
