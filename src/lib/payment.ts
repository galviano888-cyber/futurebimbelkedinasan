// Alur pembayaran manual: transfer bank + konfirmasi lewat WhatsApp admin.
// Satu tempat untuk rekening, nomor admin, dan format pesan agar konsisten.

import { supabase } from "@/lib/supabaseClient";

/** Rekening cadangan bila site_settings belum diisi. */
export const PAYMENT_BANK = {
  name: "BRI",
  number: "035601089005505",
  holder: "Galih Oktaviano",
} as const;

export const DEFAULT_ADMIN_WA = "6287753646617";

export interface PaymentBank {
  name: string;
  number: string;
  holder: string;
}

/** Ubah nomor apa pun jadi format wa.me (62...). */
export function normalizeWaNumber(raw?: string | null): string {
  const digits = (raw ?? "").replace(/[^0-9]/g, "");
  if (!digits) return DEFAULT_ADMIN_WA;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function formatRupiah(value: number): string {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

/**
 * Ambil rekening + nomor admin dari site_settings, fallback ke nilai bawaan.
 * Rekening diatur di panel admin → Landing Page → Bank.
 */
export async function getPaymentSettings(): Promise<{
  bank: PaymentBank;
  waNumber: string;
}> {
  if (!supabase) {
    return { bank: { ...PAYMENT_BANK }, waNumber: DEFAULT_ADMIN_WA };
  }

  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["bank_details", "official_contacts"]);

    const map = new Map<string, any>((data ?? []).map((row: any) => [row.key, row.value]));

    const bankRow = map.get("bank_details") ?? {};
    const bank: PaymentBank = {
      name: bankRow.name || PAYMENT_BANK.name,
      number: bankRow.number || PAYMENT_BANK.number,
      holder: bankRow.owner || bankRow.holder || PAYMENT_BANK.holder,
    };

    return {
      bank,
      waNumber: normalizeWaNumber(map.get("official_contacts")?.whatsapp),
    };
  } catch {
    return { bank: { ...PAYMENT_BANK }, waNumber: DEFAULT_ADMIN_WA };
  }
}

interface OrderMessageInput {
  packageTitle: string;
  amount: number;
  name?: string | null;
  email?: string | null;
  bank: PaymentBank;
}

/** Pesan WhatsApp berisi identitas siswa, paket, nominal, tujuan transfer, dan langkah-langkahnya. */
export function buildOrderMessage({
  packageTitle,
  amount,
  name,
  email,
  bank,
}: OrderMessageInput): string {
  return [
    "Halo Admin FBK, saya ingin memesan paket berikut:",
    "",
    `Paket: ${packageTitle}`,
    `Nominal: ${formatRupiah(amount)}`,
    `Nama: ${name || "-"}`,
    `Email: ${email || "-"}`,
    "",
    "Langkah pembayaran:",
    `1. Transfer tepat ${formatRupiah(amount)} ke rekening berikut:`,
    `   ${bank.name} ${bank.number}`,
    `   a.n. ${bank.holder}`,
    "2. Simpan bukti transfer (screenshot atau foto struk).",
    "3. Kirim bukti transfernya di chat ini.",
    "4. Admin akan memeriksa dan mengonfirmasi maksimal 1x24 jam.",
    "5. Setelah dikonfirmasi, paket otomatis muncul di menu \"Paket Saya\" dan siap dipakai.",
    "",
    "Catatan: mohon transfer sesuai nominal agar mudah diverifikasi. Kalau dalam 24 jam belum dikonfirmasi, permintaan saya akan hangus dan saya bisa memesan ulang dari website.",
    "",
    "Terima kasih.",
  ].join("\n");
}

export function buildWaHref(number: string, message: string): string {
  return `https://wa.me/${normalizeWaNumber(number)}?text=${encodeURIComponent(message)}`;
}
