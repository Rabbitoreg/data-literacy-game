// Disable RLS on auth.users table using service_role key
const { createClient } = require('@supabase/supabase-js')

// Replace with your actual service_role key
const SERVICE_ROLE_KEY = ''
const SUPABASE_URL = 'https://ddbwslrralhuuncgcppp.supabase.co'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function disableRLS() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;'
    })
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('RLS disabled successfully on auth.users')
    }
  } catch (err) {
    console.error('Failed:', err)
  }
}

disableRLS()
