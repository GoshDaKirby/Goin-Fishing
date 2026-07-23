import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// It's expected and safe for the Supabase URL + anon key to be public/baked
// into this static site's JS bundle - that's how every Supabase client app
// works. Real protection comes from Row Level Security (RLS) policies on
// the Supabase project itself, not from hiding these values. See the setup
// notes shared alongside this code for the exact policies to use.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null;
