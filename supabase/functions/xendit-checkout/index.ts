// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const XENDIT_SECRET_KEY = Deno.env.get('XENDIT_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
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

    // 3. Buat Order ID unik (External ID di Xendit)
    const external_id = `FBK-${Date.now()}-${user.id.split('-')[0]}`

    // 4. Panggil API Xendit untuk mendapatkan Invoice URL
    const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(XENDIT_SECRET_KEY + ':')}`
      },
      body: JSON.stringify({
        external_id: external_id,
        amount: pkg.price,
        payer_email: user.email,
        description: `Pembelian Paket: ${pkg.title} - FBK Kedinasan`,
        customer: {
          given_names: user.user_metadata?.full_name || 'Siswa',
          email: user.email
        },
        items: [{
          name: pkg.title,
          quantity: 1,
          price: pkg.price,
          category: pkg.product_type
        }],
        success_redirect_url: `${req.headers.get('origin')}/dashboard#paketsaya`,
        failure_redirect_url: `${req.headers.get('origin')}/dashboard#katalog`,
        currency: 'IDR'
      })
    })

    const xenditData = await xenditResponse.json()
    if (!xenditData.invoice_url) {
      console.error('Xendit Error:', xenditData)
      throw new Error(xenditData.message || 'Gagal membuat invoice di Xendit')
    }

    // 5. Simpan transaksi ke database dengan status pending
    await supabase.from('transactions').insert([{
      id: external_id, // Gunakan external_id sebagai primary key transaksi kita
      user_id: user.id,
      package_id: pkg.id,
      amount: pkg.price,
      status: 'PENDING',
      snap_token: xenditData.id, // Kita simpan Xendit Invoice ID di sini
      snap_redirect_url: xenditData.invoice_url
    }])

    return new Response(
      JSON.stringify({ invoice_url: xenditData.invoice_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error: any) {
    console.error('Checkout Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
