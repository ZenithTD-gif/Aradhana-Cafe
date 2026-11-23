import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl && 
  serviceRoleKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabaseServer = isServerSupabaseConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
      realtime: { transport: ws as any },
    })
  : null;
