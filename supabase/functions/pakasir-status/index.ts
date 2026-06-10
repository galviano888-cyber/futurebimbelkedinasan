// @ts-nocheck
// Supabase Edge Function: pakasir-status
// Cek status transaksi Pakasir berdasarkan invoice_id
//
// Deploy: supabase functions deploy pakasir-status

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

    // ── 2. Ambil order_id dari query param ──────────────────────────────
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");

    if (!orderId) {
      return new Response(JSON.stringify({ error: "order_id wajib diisi" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // ── 3. Verifikasi kepemilikan transaksi ──────────────────────────────
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("id, user_id, amount, invoice_id")
      .eq("invoice_id", orderId)
      .single();

    if (txError || !transaction) {
      return new Response(JSON.stringify({ error: "Transaksi tidak ditemukan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (transaction.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Akses ditolak" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    if (!PAKASIR_SLUG || !PAKASIR_API_KEY) {
      return new Response(JSON.stringify({ error: "Konfigurasi payment gateway tidak lengkap" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // ── 4. Query status ke Pakasir ────────────────────────────────────────
    const detailUrl = new URL("https://app.pakasir.com/api/transactiondetail");
    detailUrl.searchParams.set("project", PAKASIR_SLUG);
    detailUrl.searchParams.set("order_id", transaction.invoice_id);
    detailUrl.searchParams.set("amount", String(transaction.amount));
    detailUrl.searchParams.set("api_key", PAKASIR_API_KEY);

    const pakasirRes = await fetch(detailUrl.toString());
    const pakasirJson = await pakasirRes.json();

    if (!pakasirRes.ok || !pakasirJson.transaction) {
      return new Response(
        JSON.stringify({ error: pakasirJson?.message ?? "Transaksi tidak ditemukan di Pakasir" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 502 }
      );
    }

    return new Response(
      JSON.stringify({ status: pakasirJson.transaction.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("pakasir-status error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
