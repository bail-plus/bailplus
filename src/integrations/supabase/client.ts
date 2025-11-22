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

// Custom storage adapter pour debugging
const customStorage = {
  getItem: (key: string) => {
    const value = localStorage.getItem(key);
    return value;
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },
};

export const supabase: SupabaseClient<Database> =
  globalThis.__SUPABASE__ ??
  (globalThis.__SUPABASE__ = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      flowType: 'pkce',
      storage: customStorage as any,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // très important : clé unique pour ton app
      storageKey: 'gl-edouard-auth',
    },
  }));
