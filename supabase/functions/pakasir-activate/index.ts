// @ts-nocheck
// Supabase Edge Function: pakasir-activate
// Dipanggil dari browser setelah user klik "Saya Sudah Bayar"
// Verifikasi status ke Pakasir, lalu aktifkan paket dengan service role
//
// Deploy: supabase functions deploy pakasir-activate

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

  try {
    // ── 1. Verifikasi JWT user ──────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token tidak valid" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // ── 2. Ambil invoice_id dari body ──────────────────────────────────
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoiceId wajib diisi" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ── 3. Ambil transaksi dari DB (verifikasi kepemilikan) ──────────────────
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("id, user_id, package_id, amount, status, invoice_id")
      .eq("invoice_id", invoiceId)
      .single();

    if (txError || !transaction) {
      return new Response(JSON.stringify({ error: "Transaksi tidak ditemukan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Pastikan transaksi milik user yang login
    if (transaction.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Akses ditolak" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // ── 4. Verifikasi status ke Pakasir API ──────────────────────────────
    if (!PAKASIR_SLUG || !PAKASIR_API_KEY) {
      return new Response(JSON.stringify({ error: "Konfigurasi payment gateway tidak lengkap" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const verifyUrl = new URL("https://app.pakasir.com/api/transactiondetail");
    verifyUrl.searchParams.set("project", PAKASIR_SLUG);
    verifyUrl.searchParams.set("order_id", transaction.invoice_id);
    verifyUrl.searchParams.set("amount", String(transaction.amount));
    verifyUrl.searchParams.set("api_key", PAKASIR_API_KEY);

    const verifyRes = await fetch(verifyUrl.toString());
    const verifyJson = await verifyRes.json();

    console.log(`pakasir-activate verify untuk ${invoiceId}:`, JSON.stringify(verifyJson));

    if (!verifyRes.ok || verifyJson.transaction?.status !== "completed") {
      return new Response(
        JSON.stringify({
          error: "Pembayaran belum terkonfirmasi di Pakasir",
          pakasir_status: verifyJson.transaction?.status ?? "unknown",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 }
      );
    }

    // ── 5. Update transaksi ke success (service role, bypass RLS) ────────────
    await supabase
      .from("transactions")
      .update({ status: "success", updated_at: new Date().toISOString() })
      .eq("id", transaction.id);

    // ── 6. Aktifkan paket (service role, bypass RLS) ──────────────────────
    const { error: upError } = await supabase
      .from("user_packages")
      .upsert(
        {
          user_id: transaction.user_id,
          package_id: transaction.package_id,
          transaction_id: transaction.id,
        },
        { onConflict: "user_id,package_id" }
      );

    if (upError) {
      console.error("pakasir-activate: gagal insert user_packages", upError);
      return new Response(
        JSON.stringify({ error: "Gagal mengaktifkan paket: " + upError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // ── 7. Notifikasi in-app ─────────────────────────────────────────────────
    await supabase.from("notifications").insert({
      user_id: transaction.user_id,
      title: "Pembayaran Berhasil!",
      message: "Pembayaran QRIS kamu sudah dikonfirmasi. Akses paket sudah terbuka.",
      is_read: false,
    });

    console.log(`pakasir-activate: berhasil aktifkan paket untuk ${invoiceId}`);
    return new Response(JSON.stringify({ message: "OK" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("pakasir-activate error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
