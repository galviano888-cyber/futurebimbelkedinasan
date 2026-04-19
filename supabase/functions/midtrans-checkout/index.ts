// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const MIDTRANS_SERVER_KEY = Deno.env.get('MIDTRANS_SERVER_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const { package_id } = await req.json()

    // 1. Dapatkan User dari Token
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (userError || !user) throw new Error('Unauthorized')

    // 2. Ambil detail paket dari database
    const { data: pkg, error: pkgError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', package_id)
      .single()
    
    if (pkgError || !pkg) throw new Error('Paket tidak ditemukan')

    // 3. Buat Order ID unik
    const order_id = `FBK-${Date.now()}-${user.id.split('-')[0]}`

    // 4. Panggil API Midtrans untuk mendapatkan Snap Token
    const midtransResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(MIDTRANS_SERVER_KEY + ':')}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: order_id,
          gross_amount: pkg.price
        },
        customer_details: {
          first_name: user.user_metadata?.full_name || 'Siswa',
          email: user.email
        },
        item_details: [{
          id: pkg.id,
          price: pkg.price,
          quantity: 1,
          name: pkg.title
        }]
      })
    })

    const midtransData = await midtransResponse.json()
    if (!midtransData.token) throw new Error('Gagal mendapatkan token dari Midtrans')

    // 5. Simpan transaksi ke database dengan status pending
    await supabase.from('transactions').insert([{
      user_id: user.id,
      package_id: pkg.id,
      amount: pkg.price,
      order_id: order_id,
      snap_token: midtransData.token,
      status: 'pending'
    }])

    return new Response(
      JSON.stringify({ token: midtransData.token, redirect_url: midtransData.redirect_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
