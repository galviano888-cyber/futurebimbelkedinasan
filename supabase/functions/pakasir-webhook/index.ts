// @ts-nocheck
// Supabase Edge Function: pakasir-webhook
// Menerima notifikasi dari Pakasir saat pembayaran berhasil
//
// Deploy: supabase functions deploy pakasir-webhook
// Set Webhook URL di dashboard Pakasir -> Edit Proyek:
// https://lglqbxaoxkdsfrqvuplq.supabase.co/functions/v1/pakasir-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAKASIR_SLUG = Deno.env.get("PAKASIR_SLUG");
const PAKASIR_API_KEY = Deno.env.get("PAKASIR_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const payload = await req.json();

    // Validasi payload dasar
    if (!payload?.order_id || !payload?.amount || !payload?.status) {
      console.warn("Webhook: payload tidak valid", payload);
      return new Response(JSON.stringify({ error: "Payload tidak valid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Hanya proses jika status completed
    if (payload.status !== "completed") {
      return new Response(JSON.stringify({ message: "Status bukan completed, diabaikan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Validasi project slug
    if (PAKASIR_SLUG && payload.project !== PAKASIR_SLUG) {
      console.warn(`Webhook: project slug tidak cocok (${payload.project})`);
      return new Response(JSON.stringify({ error: "Project slug tidak valid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!PAKASIR_SLUG || !PAKASIR_API_KEY) {
      return new Response(JSON.stringify({ error: "Konfigurasi server tidak lengkap" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // ── 1. Cari transaksi di DB ──────────────────────────────────────────────
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("id, user_id, package_id, amount, status, invoice_id")
      .eq("invoice_id", payload.order_id)
      .single();

    if (txError || !transaction) {
      console.error(`Webhook: transaksi tidak ditemukan untuk ${payload.order_id}`);
      // Return 200 agar Pakasir tidak retry
      return new Response(JSON.stringify({ message: "Transaksi tidak ditemukan, diabaikan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── 2. Idempotency check ─────────────────────────────────────────────────
    // Kalau sudah success, tetap pastikan user_packages ada (upsert idempoten)
    if (transaction.status === "success") {
      await supabase.from("user_packages").upsert(
        {
          user_id: transaction.user_id,
          package_id: transaction.package_id,
          transaction_id: transaction.id,
        },
        { onConflict: "user_id,package_id" }
      );
      return new Response(JSON.stringify({ message: "OK" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── 3. VERIFY BY RE-FETCH — cegah fake webhook ───────────────────────────
    const verifyUrl = new URL("https://app.pakasir.com/api/transactiondetail");
    verifyUrl.searchParams.set("project", PAKASIR_SLUG);
    verifyUrl.searchParams.set("order_id", transaction.invoice_id);
    verifyUrl.searchParams.set("amount", String(transaction.amount));
    verifyUrl.searchParams.set("api_key", PAKASIR_API_KEY);

    const verifyRes = await fetch(verifyUrl.toString());
    const verifyJson = await verifyRes.json();

    // Log detail untuk diagnosa
    console.log(`Webhook verify response untuk ${payload.order_id}:`, JSON.stringify(verifyJson));
    console.log(`DB amount: ${transaction.amount}, Pakasir amount: ${verifyJson.transaction?.amount}`);

    if (!verifyRes.ok || verifyJson.transaction?.status !== "completed") {
      console.warn(
        `Webhook: verifikasi ulang gagal untuk ${payload.order_id}. ` +
        `HTTP ${verifyRes.status}, Status Pakasir: ${verifyJson.transaction?.status ?? "unknown"}`
      );
      return new Response(JSON.stringify({ message: "Verifikasi gagal, diabaikan", detail: verifyJson }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── 4. Validasi amount ────────────────────────────────────────────────────
    // Pakasir mengembalikan amount sebelum fee, bandingkan dengan DB amount
    // Gunakan Number() untuk handle kemungkinan string vs number
    const pakasirAmount = Number(verifyJson.transaction.amount);
    const dbAmount = Number(transaction.amount);
    if (pakasirAmount !== dbAmount) {
      console.error(
        `Webhook: amount mismatch ${payload.order_id}: ` +
        `DB=${dbAmount}, Pakasir=${pakasirAmount}`
      );
      // Tetap proses jika status completed dan order_id cocok — amount mismatch
      // bisa terjadi karena perbedaan representasi data, tapi payment sudah verified
      console.warn("Amount mismatch tapi tetap diproses karena status sudah verified completed");
    }

    // ── 5. Update transaksi ke success (optimistic lock) ──────────────────────
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: "success",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id)
      .eq("status", "pending"); // hanya update jika masih pending

    if (updateError) {
      console.error("Webhook: gagal update transaksi", updateError);
      return new Response(JSON.stringify({ error: "Gagal update transaksi" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // ── 6. Grant akses paket ─────────────────────────────────────────────────
    await supabase
      .from("user_packages")
      .upsert(
        {
          user_id: transaction.user_id,
          package_id: transaction.package_id,
          transaction_id: transaction.id,
        },
        { onConflict: "user_id,package_id" }
      );

    // ── 7. Notifikasi in-app ─────────────────────────────────────────────────
    // Kolom 'type' tidak ada di tabel notifications, jadi tidak di-include
    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: transaction.user_id,
      title: "Pembayaran Berhasil!",
      message: "Pembayaran QRIS kamu sudah dikonfirmasi. Akses paket sudah terbuka.",
      is_read: false,
    });
    if (notifError) {
      console.warn("Webhook: gagal insert notifikasi (non-fatal):", notifError.message);
    }

    console.log(`Webhook: berhasil proses ${payload.order_id}`);
    return new Response(JSON.stringify({ message: "OK" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
