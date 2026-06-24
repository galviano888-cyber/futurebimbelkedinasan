// @ts-nocheck
// Supabase Edge Function: pakasir-webhook
// Menerima notifikasi dari Pakasir saat pembayaran berhasil
//
// Deploy: supabase functions deploy pakasir-webhook
// Set Webhook URL di dashboard Pakasir -> Edit Proyek:
// https://lglqbxaoxkdsfrqvuplq.supabase.co/functions/v1/pakasir-webhook
//
// Required env vars:
//   PAKASIR_SLUG, PAKASIR_API_KEY, PAKASIR_WEBHOOK_SECRET,
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAKASIR_SLUG             = Deno.env.get("PAKASIR_SLUG");
const PAKASIR_API_KEY          = Deno.env.get("PAKASIR_API_KEY");
const PAKASIR_WEBHOOK_SECRET   = Deno.env.get("PAKASIR_WEBHOOK_SECRET"); // shared secret set di Pakasir dashboard
const SUPABASE_URL             = Deno.env.get("SUPABASE_URL");
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
    // ── 0. Shared secret verification ────────────────────────────────────────
    // Pakasir mengirim secret via header X-Pakasir-Secret (atur di dashboard)
    // Jika PAKASIR_WEBHOOK_SECRET diset, wajib cocok
    if (PAKASIR_WEBHOOK_SECRET) {
      const incomingSecret = req.headers.get("x-pakasir-secret") ??
                             req.headers.get("x-webhook-secret") ??
                             req.headers.get("authorization")?.replace("Bearer ", "");
      if (!incomingSecret || incomingSecret !== PAKASIR_WEBHOOK_SECRET) {
        console.warn("Webhook: secret tidak valid atau tidak ada");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }
    }

    const payload = await req.json();

    // ── 1. Validasi payload dasar ─────────────────────────────────────────────
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

    // ── 2. Cari transaksi di DB ──────────────────────────────────────────────
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

    // ── 3. Idempotency check ─────────────────────────────────────────────────
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

    // ── 4. VERIFY BY RE-FETCH — cegah fake webhook ───────────────────────────
    const verifyUrl = new URL("https://app.pakasir.com/api/transactiondetail");
    verifyUrl.searchParams.set("project", PAKASIR_SLUG);
    verifyUrl.searchParams.set("order_id", transaction.invoice_id);
    verifyUrl.searchParams.set("amount", String(transaction.amount));
    verifyUrl.searchParams.set("api_key", PAKASIR_API_KEY);

    const verifyRes = await fetch(verifyUrl.toString());
    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok || verifyJson.transaction?.status !== "completed") {
      console.warn(
        `Webhook: verifikasi ulang gagal untuk ${payload.order_id}. ` +
        `HTTP ${verifyRes.status}, Status Pakasir: ${verifyJson.transaction?.status ?? "unknown"}`
      );
      return new Response(JSON.stringify({ message: "Verifikasi gagal, diabaikan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── 5. Validasi amount — hard reject jika tidak cocok ────────────────────
    const pakasirAmount = Number(verifyJson.transaction.amount);
    const dbAmount = Number(transaction.amount);
    if (pakasirAmount !== dbAmount) {
      console.error(
        `Webhook: amount mismatch ${payload.order_id}: DB=${dbAmount}, Pakasir=${pakasirAmount}. Ditolak.`
      );
      return new Response(JSON.stringify({ error: "Amount tidak sesuai" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ── 6. Update transaksi ke success (optimistic lock) ──────────────────────
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

    // ── 7. Grant akses paket ─────────────────────────────────────────────────
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

    // ── 8. Notifikasi in-app ─────────────────────────────────────────────────
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
