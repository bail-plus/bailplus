// src/integrations/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

// ⚠️ TEST: Recréer le client à chaque fois (pas de singleton)
console.log('🔧 [SUPABASE] Creating new client...');
export const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: 'pkce',
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'gl-edouard-auth',
  },
});
console.log('✅ [SUPABASE] Client created');

// Exposer supabase globalement pour le debugging (DEV uniquement)
if (import.meta.env.DEV) {
  (window as any).supabase = supabase;
}
