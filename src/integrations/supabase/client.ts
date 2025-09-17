// src/integrations/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// Instance unique, même après HMR
declare global {
  // eslint-disable-next-line no-var
  var __SUPABASE__: SupabaseClient<Database> | undefined;
}
console.log('[SB/CLIENT]', { SUPABASE_URL, hasAnon: !!SUPABASE_ANON_KEY });

export const supabase: SupabaseClient<Database> =
  globalThis.__SUPABASE__ ??
  (globalThis.__SUPABASE__ = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'gl-edouard-auth', // namespace unique
    },
  }));
