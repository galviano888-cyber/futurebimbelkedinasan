// @ts-nocheck
// Supabase Edge Function: pakasir-create
// Buat transaksi QRIS via Pakasir API
//
// Deploy: supabase functions deploy pakasir-create
// Secrets: supabase secrets set PAKASIR_SLUG=xxx PAKASIR_API_KEY=xxx

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
    // ── 1. Verifikasi JWT ────────────────────────────────────────────
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

    // ── 2. Ambil invoiceId dari body ─────────────────────────────────────
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoiceId wajib diisi" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ── 3. Ambil transaksi dari DB (amount dari DB, bukan dari client) ──────
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("id, user_id, invoice_id, amount, status, payment_method")
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

    // Pastikan masih pending
    if (transaction.status !== "pending") {
      return new Response(
        JSON.stringify({ error: `Transaksi sudah dalam status: ${transaction.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    if (!PAKASIR_SLUG || !PAKASIR_API_KEY) {
      return new Response(JSON.stringify({ error: "Konfigurasi payment gateway tidak lengkap" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // ── 4. Buat QRIS di Pakasir ──────────────────────────────────────────
    const pakasirRes = await fetch(
      "https://app.pakasir.com/api/transactioncreate/qris",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: PAKASIR_SLUG,
          order_id: transaction.invoice_id, // dari DB
          amount: transaction.amount,        // dari DB
          api_key: PAKASIR_API_KEY,
        }),
      }
    );

    const pakasirJson = await pakasirRes.json();

    if (!pakasirRes.ok || !pakasirJson.payment) {
      console.error("Pakasir API error:", pakasirJson);
      return new Response(
        JSON.stringify({ error: pakasirJson?.message ?? "Gagal membuat transaksi di Pakasir" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    const p = pakasirJson.payment;
    const pakasirData = {
      payment_number: p.payment_number,
      fee: p.fee,
      total_payment: p.total_payment,
      expired_at: p.expired_at,
      payment_method: p.payment_method,
    };

    // ── 5. Simpan pakasir_data ke DB dari server ────────────────────────────
    await supabase
      .from("transactions")
      .update({
        payment_method: "pakasir_qris",
        pakasir_data: pakasirData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    return new Response(JSON.stringify({ data: pakasirData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("pakasir-create error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
