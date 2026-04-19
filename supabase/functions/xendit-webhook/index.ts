// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const XENDIT_CALLBACK_TOKEN = Deno.env.get('XENDIT_CALLBACK_TOKEN')

serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    
    // 1. Verifikasi Token Callback (Keamanan)
    const callbackToken = req.headers.get('x-callback-token')
    if (XENDIT_CALLBACK_TOKEN && callbackToken !== XENDIT_CALLBACK_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json()
    console.log('Received Xendit Webhook:', body)

    const external_id = body.external_id
    const status = body.status // SETTLED, PAID, EXPIRED
    const amount = body.amount

    // 2. Cari transaksi di database
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', external_id)
      .single()

    if (txError || !transaction) {
      console.error('Transaksi tidak ditemukan:', external_id)
      return new Response(JSON.stringify({ error: 'Transaction not found' }), { status: 404 })
    }

    // 3. Tentukan status baru di DB kita
    let newStatus = 'PENDING'
    if (status === 'SETTLED' || status === 'PAID') {
      newStatus = 'SUCCESS'
      
      // AKTIFKAN PAKET OTOMATIS!
      const { data: existing } = await supabase
        .from('user_packages')
        .select('*')
        .eq('user_id', transaction.user_id)
        .eq('package_id', transaction.package_id)
        .single()

      if (!existing) {
        const { error: activateError } = await supabase.from('user_packages').insert([{
          user_id: transaction.user_id,
          package_id: transaction.package_id,
          transaction_id: transaction.id
        }])
        
        if (activateError) {
          console.error('Gagal aktivasi paket:', activateError)
        } else {
          console.log('Paket berhasil diaktivasi untuk user:', transaction.user_id)
        }
      }
    } else if (status === 'EXPIRED') {
      newStatus = 'EXPIRED'
    }

    // 4. Update status transaksi
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', external_id)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ message: 'Success' }), { status: 200 })

  } catch (error: any) {
    console.error('Webhook Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
