import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with auth configuration
const supabaseUrl = 'https://jdfvnvevxpswjnbhosit.supabase.co';
const supabaseKey = 'sb_publishable_EfkLnCfYH2b0AyAo7UPA2g_eFM1eZFi';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export { supabase };
