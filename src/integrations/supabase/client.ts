// src/integrations/supabase/client.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!; // (= anon public key)

// Optionnel : garde-fous utiles en dev
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquant(s).'
  );
}

// --- Singleton HMR-safe ---
// On met l'instance sur globalThis pour éviter les doublons quand Vite recharge des modules.
declare global {
  // eslint-disable-next-line no-var
  var __SUPABASE__: SupabaseClient<Database> | undefined;
}

export const supabase: SupabaseClient<Database> =
  globalThis.__SUPABASE__ ??
  (globalThis.__SUPABASE__ = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // en navigateur, localStorage est ok
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // très important : clé unique pour ton app
      storageKey: 'gl-edouard-auth',
    },
  }));
