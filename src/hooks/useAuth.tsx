import { useState, useEffect, createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

/* =======================
   Types
   ======================= */
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export type Subscription = Tables<'subscriptions'>;
export type SubscriptionInsert = TablesInsert<'subscriptions'>;
export type SubscriptionUpdate = TablesUpdate<'subscriptions'>;

export type Gender = 'male' | 'female' | 'other';
export type Role = 'admin' | 'user' | 'trial';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

/* =======================
   Helpers
   ======================= */
const toDateOnly = (v: any): string | null => {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const upsertProfileFromUser = async (u: User) => {
  const md = (u.user_metadata ?? {}) as any;

  const payload = {
    user_id: u.id,
    email: u.email ?? null,
    first_name: md.first_name ?? null,
    last_name: md.last_name ?? null,
    role: md.role ?? 'trial',
    trial_end_date: toDateOnly(md.trial_end_date),
    gender: md.gender ?? null,
    birthdate: toDateOnly(md.birthdate),
    phone_number: md.phone_number ?? null,
    adress: md.adress ?? null,
    city: md.city ?? null,
    postal_code: String(md.postal_code ?? '') || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload as any, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('upsertProfileFromUser error', error);
    throw error;
  }

  return data;
};

/* =======================
   API Functions
   ======================= */
async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

async function fetchSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function signUpUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  trial_end_date?: string | null;
  gender?: Gender;
  birthdate?: string | null;
  phone_number?: string;
  adress?: string;
  city?: string;
  postal_code?: string;
}) {
  const {
    email,
    password,
    firstName,
    lastName,
    role = 'trial',
    trial_end_date = null,
    gender = 'other',
    birthdate = null,
    phone_number = '',
    adress = '',
    city = '',
    postal_code = ''
  } = params;

  // Calculer la date de fin d'essai (30 jours à partir d'aujourd'hui)
  const trialEndDate = trial_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        first_name: firstName,
        last_name: lastName,
        role,
        trial_end_date: trialEndDate,
        gender,
        birthdate,
        phone_number,
        adress,
        city,
        postal_code
      },
    }
  });

  if (error) throw error;
  return { success: true };
}

async function signInUser(email: string, password: string) {
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const u = data.session?.user;
  if (u?.id) {
    await upsertProfileFromUser(u);
  }

  return data;
}

async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/* =======================
   Context
   ======================= */
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  initialized: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let hydrated = false;

    // Listener Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      setSession(session ?? null);
      const u = session?.user ?? null;
      setUser(u);

      if (!hydrated) {
        hydrated = true;
        setInitialized(true);
      }

      if (u?.id && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        try {
          await upsertProfileFromUser(u);
        } catch (e) {
          console.error('auth hydrate error', e);
        }
      }

      if (event === 'SIGNED_OUT') {
        setLoading(false);
      }
    });

    // Hydratation initiale
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) console.error('getSession error', error);

        const sess = data?.session ?? null;
        const u = sess?.user ?? null;

        setSession(sess);
        setUser(u);

        if (!hydrated) {
          hydrated = true;
          setInitialized(true);
        }
      } catch (e) {
        console.error('getSession exception', e);
        if (!hydrated) {
          hydrated = true;
          setInitialized(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    // Safety timeout
    const t = setTimeout(() => {
      if (!hydrated) {
        console.warn('[AUTH] force initialized=true after 2s safety');
        hydrated = true;
        setInitialized(true);
        setLoading(false);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(t);
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

/* =======================
   Hooks React Query
   ======================= */
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useProfile() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => {
      console.log('[QUERY/PROFILE] Fetching profile for user:', user?.id);
      return fetchProfile(user!.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubscription() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => {
      console.log('[QUERY/SUBSCRIPTION] Fetching subscription for user:', user?.id);
      return fetchSubscription(user!.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: signUpUser,
    onSuccess: () => {
      toast.success('Compte créé avec succès ! Vérifiez vos emails.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la création du compte');
    },
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      signInUser(email, password),
    onSuccess: () => {
      toast.success('Connexion réussie !');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur de connexion');
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signOutUser,
    onSuccess: () => {
      toast.success('Déconnexion réussie');
      queryClient.clear();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la déconnexion');
    },
  });
}

// Hook principal qui combine tout
export function useAuth() {
  const { user, session, loading, initialized } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();

  // Le système est prêt quand tout est chargé
  const isReady = initialized && !profileLoading && !subscriptionLoading;

  const result = {
    user,
    session,
    profile: profile ?? null,
    subscription: subscription ?? null,
    loading,
    initialized,
    isReady, // Nouveau flag qui indique que TOUT est chargé
  };

  console.log('[HOOK/useAuth]', {
    user: !!user,
    loading,
    initialized,
    isReady,
    profile: !!profile,
    profileLoading,
    subscription: !!subscription,
    subscriptionLoading,
    trial_end_date: profile?.trial_end_date,
    subscription_status: subscription?.subscription_status,
  });

  return result;
}

// Hook utilitaire pour vérifier l'abonnement
export function useIsSubscribed() {
  const { subscription } = useAuth();

  if (!subscription) return false;

  const status = subscription.subscription_status?.toLowerCase() ?? '';
  return subscription.subscribed || status === 'active' || status === 'trialing';
}
