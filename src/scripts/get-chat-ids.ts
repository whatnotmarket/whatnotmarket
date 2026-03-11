import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function getUserIds() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .or('username.ilike.openlymarket,username.ilike.testbuyer,full_name.ilike.%Test Buyer%')

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log('Found users:', JSON.stringify(users, null, 2))
}

getUserIds()

