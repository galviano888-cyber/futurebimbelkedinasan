// @ts-nocheck
// Supabase Edge Function: pakasir-activate
// Dipanggil dari browser setelah user klik "Saya Sudah Bayar".
// Verifikasi status ke Pakasir, lalu aktifkan paket dengan service role.

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Konfigurasi server tidak lengkap" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (userError || !user) {
      return json({ error: "Token tidak valid" }, 401);
    }

    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return json({ error: "invoiceId wajib diisi" }, 400);
    }

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("id, user_id, package_id, amount, price_snapshot, status, invoice_id")
      .eq("invoice_id", invoiceId)
      .single();

    if (txError || !transaction) {
      return json({ error: "Transaksi tidak ditemukan" }, 404);
    }

    if (transaction.user_id !== user.id) {
      return json({ error: "Akses ditolak" }, 403);
    }

    if (transaction.status === "success") {
      const { error } = await supabase.rpc("grant_package", {
        p_transaction_id: transaction.id,
      });
      if (error) return json({ error: "Gagal memastikan akses paket" }, 500);
      return json({ message: "OK" }, 200);
    }

    if (!PAKASIR_SLUG || !PAKASIR_API_KEY) {
      return json({ error: "Konfigurasi payment gateway tidak lengkap" }, 500);
    }

    const verifyUrl = new URL("https://app.pakasir.com/api/transactiondetail");
    verifyUrl.searchParams.set("project", PAKASIR_SLUG);
    verifyUrl.searchParams.set("order_id", transaction.invoice_id);
    verifyUrl.searchParams.set("amount", String(transaction.amount));
    verifyUrl.searchParams.set("api_key", PAKASIR_API_KEY);

    const verifyRes = await fetch(verifyUrl.toString());
    const verifyJson = await verifyRes.json();

    if (!verifyRes.ok || verifyJson.transaction?.status !== "completed") {
      return json(
        {
          error: "Pembayaran belum terkonfirmasi di Pakasir",
          pakasir_status: verifyJson.transaction?.status ?? "unknown",
        },
        402,
      );
    }

    const paidAmount = Number(verifyJson.transaction.amount);
    const expectedAmount = Number(transaction.price_snapshot ?? transaction.amount);

    if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
      await supabase.from("payment_events").insert({
        transaction_id: transaction.id,
        event_type: "amount_mismatch",
        payload: { expected: expectedAmount, paid: paidAmount, source: "activate" },
      });
      return json({ error: "Amount pembayaran tidak sesuai" }, 400);
    }

    const { error: grantError } = await supabase.rpc("grant_package", {
      p_transaction_id: transaction.id,
    });

    if (grantError) {
      console.error("pakasir-activate: grant_package gagal", grantError);
      return json({ error: "Gagal mengaktifkan paket" }, 500);
    }

    await supabase.from("payment_events").insert({
      transaction_id: transaction.id,
      event_type: "granted",
      payload: { paidAmount, expectedAmount, source: "activate" },
    });

    return json({ message: "OK" }, 200);
  } catch (error: any) {
    console.error("pakasir-activate error:", error.message);
    return json({ error: error.message }, 500);
  }
});
