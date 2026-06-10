// Pakasir Payment Gateway — Client-side service
// Docs: https://pakasir.com/p/docs
//
// Semua call ke Pakasir API dilakukan lewat Supabase Edge Functions.
// JWT Supabase dikirim di setiap request untuk verifikasi identity dan kepemilikan transaksi.

import { supabase } from '@/lib/supabaseClient';

// URL base Supabase Edge Functions
// Format: https://<project-ref>.supabase.co/functions/v1
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PakasirPaymentData {
  payment_number: string;   // QR string untuk di-render jadi QR image
  fee: number;
  total_payment: number;    // amount + fee (yang dibayar user)
  expired_at: string;       // ISO string
  payment_method: string;   // 'qris'
}

export interface PakasirCreateResponse {
  ok: true;
  data: PakasirPaymentData;
}

export interface PakasirErrorResponse {
  ok: false;
  error: string;
}

export type PakasirResponse = PakasirCreateResponse | PakasirErrorResponse;

// ─── Helper: dapatkan JWT dari sesi Supabase ─────────────────────────────────

async function getAuthHeader(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? `Bearer ${session.access_token}` : null;
}

// ─── API Calls (lewat Supabase Edge Functions) ──────────────────────────────

/**
 * Buat transaksi QRIS Pakasir via Edge Function.
 * Amount diambil dari DB di server — tidak perlu dikirim dari client.
 */
export async function createPakasirQris(
  invoiceId: string
): Promise<PakasirResponse> {
  const authHeader = await getAuthHeader();
  if (!authHeader) {
    return { ok: false, error: 'Sesi tidak ditemukan. Silakan login ulang.' };
  }

  try {
    const res = await fetch(`${FUNCTIONS_URL}/pakasir-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ invoiceId }),
    });

    const json = await res.json();

    if (!res.ok) {
      return { ok: false, error: json.error ?? 'Gagal membuat transaksi Pakasir' };
    }

    return { ok: true, data: json.data as PakasirPaymentData };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: message };
  }
}

/**
 * Cek status transaksi Pakasir berdasarkan invoice_id.
 * Berguna untuk polling manual jika diperlukan.
 */
export async function checkPakasirStatus(
  invoiceId: string
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const authHeader = await getAuthHeader();
  if (!authHeader) {
    return { ok: false, error: 'Sesi tidak ditemukan. Silakan login ulang.' };
  }

  try {
    const res = await fetch(
      `${FUNCTIONS_URL}/pakasir-status?order_id=${encodeURIComponent(invoiceId)}`,
      { headers: { 'Authorization': authHeader } }
    );
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error };
    return { ok: true, status: json.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { ok: false, error: message };
  }
}
