// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const body = await req.json()

    console.log('Received Midtrans Webhook:', body)

    const order_id = body.order_id
    const transaction_status = body.transaction_status
    const fraud_status = body.fraud_status

    // 1. Cari transaksi di database kita
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', order_id)
      .single()

    if (txError || !transaction) throw new Error('Transaksi tidak ditemukan')

    let newStatus = 'pending'
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        newStatus = 'settlement'
        
        // AKTIFKAN PAKET OTOMATIS!
        // Cek dulu apakah sudah aktif agar tidak double insert
        const { data: existing } = await supabase
          .from('user_packages')
          .select('*')
          .eq('user_id', transaction.user_id)
          .eq('package_id', transaction.package_id)
          .single()

        if (!existing) {
          await supabase.from('user_packages').insert([{
            user_id: transaction.user_id,
            package_id: transaction.package_id,
            status: 'active'
          }])

          // Send notification
          await supabase.from('notifications').insert([{
            user_id: transaction.user_id,
            title: "Pembayaran Otomatis Berhasil! 🎉",
            message: `Pembayaran untuk invoice ${transaction.invoice_id || order_id} telah terkonfirmasi secara otomatis. Paket sudah bisa diakses.`,
            is_read: false
          }])
        }
      }
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      newStatus = transaction_status
    }

    // 2. Update status transaksi
    await supabase
      .from('transactions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('order_id', order_id)

    return new Response(JSON.stringify({ message: 'Success' }), { status: 200 })

  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
