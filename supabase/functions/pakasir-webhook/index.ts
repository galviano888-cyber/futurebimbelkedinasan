// @ts-nocheck
// Supabase Edge Function: pakasir-webhook
// Menerima notifikasi dari Pakasir setelah pembayaran berhasil.
//
// Deploy: supabase functions deploy pakasir-webhook
// Wajib set:
//   PAKASIR_SLUG, PAKASIR_API_KEY,
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Pakasir tidak mengirim Supabase JWT atau custom header. Keamanan berasal dari
// pencocokan order/nominal dengan database dan verifikasi ulang ke API Pakasir.

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
    const payload = await req.json();

    if (!payload?.order_id || !payload?.status || payload?.amount == null || !payload?.project) {
      return json({ error: "Payload tidak valid" }, 400);
    }

    if (payload.status !== "completed") {
      return json({ message: "Status bukan completed, diabaikan" }, 200);
    }

    if (!PAKASIR_SLUG || payload.project !== PAKASIR_SLUG) {
      return json({ error: "Project slug tidak valid" }, 400);
    }

    if (!PAKASIR_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: "Konfigurasi server tidak lengkap" }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("id, user_id, package_id, amount, price_snapshot, status, invoice_id")
      .eq("invoice_id", payload.order_id)
      .single();

    if (txError || !transaction) {
      console.error(`Webhook: transaksi tidak ditemukan untuk ${payload.order_id}`);
      return json({ message: "Transaksi tidak ditemukan, diabaikan" }, 200);
    }

    await supabase.from("payment_events").insert({
      transaction_id: transaction.id,
      event_type: "webhook_received",
      payload,
    });

    if (transaction.status === "success") {
      const { error } = await supabase.rpc("grant_package", {
        p_transaction_id: transaction.id,
      });
      if (error) {
        console.error("Webhook: gagal memastikan akses paket", error);
        return json({ error: "Gagal memastikan akses paket" }, 500);
      }
      return json({ message: "OK" }, 200);
    }

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
          `HTTP ${verifyRes.status}, status ${verifyJson.transaction?.status ?? "unknown"}`,
      );
      return json({ message: "Verifikasi gagal, diabaikan" }, 200);
    }

    const paidAmount = Number(verifyJson.transaction.amount);
    const expectedAmount = Number(transaction.price_snapshot ?? transaction.amount);

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount !== expectedAmount ||
      Number(payload.amount) !== expectedAmount
    ) {
      console.error(
        `Webhook: amount mismatch ${payload.order_id}: expected=${expectedAmount}, paid=${paidAmount}`,
      );
      await supabase.from("payment_events").insert({
        transaction_id: transaction.id,
        event_type: "amount_mismatch",
        payload: { expected: expectedAmount, paid: paidAmount, webhook_amount: payload.amount },
      });
      return json({ error: "Amount tidak sesuai" }, 400);
    }

    const { error: grantError } = await supabase.rpc("grant_package", {
      p_transaction_id: transaction.id,
    });

    if (grantError) {
      console.error("Webhook: grant_package gagal", grantError);
      return json({ error: "Gagal mengaktifkan paket" }, 500);
    }

    await supabase.from("payment_events").insert({
      transaction_id: transaction.id,
      event_type: "granted",
      payload: { paidAmount, expectedAmount },
    });

    console.log(`Webhook: berhasil proses ${payload.order_id}`);
    return json({ message: "OK" }, 200);
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return json({ error: error.message }, 500);
  }
});
