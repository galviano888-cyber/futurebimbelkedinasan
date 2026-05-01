import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lglqbxaoxkdsfrqvuplq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbHFieGFveGtkc2ZycXZ1cGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDkyMjcsImV4cCI6MjA5MTk4NTIyN30.9GISUStfMrPjI_x7BLMM0e528H7s7d4pIbLZ6HfjoHA'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  const { data: pkgs, error: err1 } = await supabase.from('packages').select('*')
  console.log('Packages:', pkgs)
  
  const { data: contents, error: err2 } = await supabase.from('package_contents').select('*')
  console.log('Package Contents:', contents)
}

checkData()
