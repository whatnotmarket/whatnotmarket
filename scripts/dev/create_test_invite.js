
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env.local
try {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^"(.*)"$/, '$1');
        process.env[key] = value;
      }
    });
  } else {
      console.log('.env.local not found, trying process.env');
  }
} catch (e) {
  console.error('Error reading .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createInvite() {
  const code = 'TEST';
  const type = 'buyer';
  
  console.log(`Checking for existing invite code: ${code}`);

  // Check if exists
  const { data: existing, error: fetchError } = await supabase
    .from('invite_codes')
    .select('*')
    .eq('code', code)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
      console.error('Error fetching invite code:', fetchError);
      return;
  }

  if (existing) {
    console.log(`Invite code ${code} already exists.`);
    // Update it to be active and valid
    const { error } = await supabase
      .from('invite_codes')
      .update({
        status: 'active',
        role: type, // Try 'role' instead of 'type'
        // usage_limit: 100,
        expires_at: null,
        // metadata: { note: 'Updated for testing' }
      })
      .eq('code', code);
      
    if (error) {
      console.error('Error updating invite code:', error);
    } else {
      console.log('Updated existing invite code to remain active.');
    }
    return;
  }

  console.log(`Creating new invite code: ${code}`);
  const { error } = await supabase
    .from('invite_codes')
    .insert({
      code: code,
      // type: type, // Commented out to see if it works
      status: 'active',
      // usage_limit: 100
      // metadata: { note: 'Created for testing' } 
    });

  if (error) {
    console.error('Error creating invite code:', error);
  } else {
    console.log(`Invite code ${code} created successfully.`);
  }
}

createInvite();
