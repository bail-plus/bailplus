import { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
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

  // Extraire first_name et last_name depuis Google (full_name) ou formulaire classique
  let firstName = md.first_name ?? null;
  let lastName = md.last_name ?? null;

  // Si Google OAuth, extraire depuis full_name
  if (md.full_name && !firstName && !lastName) {
    const parts = md.full_name.split(' ');
    firstName = parts[0] || null;
    lastName = parts.slice(1).join(' ') || null;
  }

  // Convertir postal_code en number ou null
  let postalCodeNumber: number | null = null;
  if (md.postal_code) {
    const parsed = parseInt(String(md.postal_code), 10);
    if (!isNaN(parsed)) {
      postalCodeNumber = parsed;
    }
  }

  // Calculer trial_end_date si pas déjà défini (7 jours)
  const trialEndDate = md.trial_end_date
    ? toDateOnly(md.trial_end_date)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const payload = {
    user_id: u.id,
    email: u.email ?? null,
    first_name: firstName,
    last_name: lastName,
    role: md.role ?? 'trial',
    trial_end_date: trialEndDate,
    gender: md.gender ?? null,
    birthdate: toDateOnly(md.birthdate),
    phone_number: md.phone_number ?? null,
    adress: md.adress ?? null,
    city: md.city ?? null,
    postal_code: postalCodeNumber,
    updated_at: new Date().toISOString(),
  };

  console.log('[upsertProfileFromUser] Payload:', payload);

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload as any, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[upsertProfileFromUser] Error:', error);
    throw error;
  }

  console.log('[upsertProfileFromUser] Success:', data);
  return data;
};

/* =======================
   API Functions
   ======================= */
async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[FETCH/PROFILE] Error:', error);
      return null;
    }

    // Sauvegarder en localStorage pour le cache
    if (data) {
      localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
    }

    return data;
  } catch (err) {
    console.error('[FETCH/PROFILE] Exception:', err);
    return null;
  }
}

async function fetchSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[FETCH/SUBSCRIPTION] Error:', error);
      return null;
    }

    // Sauvegarder en localStorage pour le cache
    if (data) {
      localStorage.setItem(`subscription_${userId}`, JSON.stringify(data));
    }

    return data;
  } catch (err) {
    console.error('[FETCH/SUBSCRIPTION] Exception:', err);
    return null;
  }
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

  // Calculer la date de fin d'essai (7 jours à partir d'aujourd'hui)
  const trialEndDate = trial_end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

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

async function signInWithGoogle() {
  const { error, data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/app`,
    }
  });
  if (error) throw error;
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
  const queryClient = useQueryClient();

  // DEBUG: Compteur de renders
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('[AUTH/PROVIDER] Render #', renderCount.current);

  // Utiliser des refs pour stabiliser les objets user/session
  // Ne les mettre à jour que si l'ID change réellement
  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);

  // Comparer les IDs pour savoir si on doit changer l'objet
  const userChanged = user?.id !== userRef.current?.id;
  const sessionChanged = session?.access_token !== sessionRef.current?.access_token;

  if (userChanged) {
    console.log('[AUTH/PROVIDER] User changed:', { oldId: userRef.current?.id, newId: user?.id });
    userRef.current = user;
  }
  if (sessionChanged) {
    console.log('[AUTH/PROVIDER] Session changed:', { oldToken: sessionRef.current?.access_token?.slice(0, 10), newToken: session?.access_token?.slice(0, 10) });
    sessionRef.current = session;
  }

  const stableUser = userRef.current;
  const stableSession = sessionRef.current;

  useEffect(() => {
    let cancelled = false;
    let hydrated = false;

    // Listener Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;

      console.log('[AUTH] Event:', event, 'Session:', !!session);

      const newSession = session ?? null;
      const newUser = session?.user ?? null;

      // Ne mettre à jour l'état QUE si l'ID a changé pour éviter les re-renders inutiles
      setSession(prev => {
        if (prev?.access_token === newSession?.access_token) {
          console.log('[AUTH] Session unchanged, skip setState');
          return prev;
        }
        console.log('[AUTH] Session CHANGED, updating state');
        return newSession;
      });

      setUser(prev => {
        if (prev?.id === newUser?.id) {
          console.log('[AUTH] User unchanged, skip setState');
          return prev;
        }
        console.log('[AUTH] User CHANGED, updating state');
        return newUser;
      });

      if (!hydrated) {
        hydrated = true;
        setInitialized(true);
      }

      // Créer le profil automatiquement lors de la connexion OAuth
      if (newUser?.id && (event === 'SIGNED_IN')) {
        try {
          console.log('[AUTH] Creating profile for OAuth user');
          await upsertProfileFromUser(newUser);
        } catch (e) {
          console.error('[AUTH] Error creating profile:', e);
        }
      }

      // Invalider uniquement les queries liées à l'auth quand le token est rafraîchi
      // if (event === 'TOKEN_REFRESHED') {
      //   const currentUserId = (session?.user?.id ?? u?.id) || undefined;
      //   console.log('[AUTH] Token refreshed, invalidate auth-scoped queries', { currentUserId });
      //   // Ne pas déclencher un refetch global qui peut bloquer l'UI
      //   queryClient.invalidateQueries({ queryKey: ['profile'] });
      //   queryClient.invalidateQueries({ queryKey: ['subscription'] });
      //   if (currentUserId) {
      //     queryClient.invalidateQueries({ queryKey: ['profile', currentUserId] });
      //     queryClient.invalidateQueries({ queryKey: ['subscription', currentUserId] });
      //   }
      // }

      if (event === 'SIGNED_OUT') {
        setLoading(false);
        queryClient.clear();
        // Nettoyer le localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('profile_') || key.startsWith('subscription_')) {
            localStorage.removeItem(key);
          }
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // queryClient est stable et ne change jamais, pas besoin de le mettre en dépendance

  // Mémoriser la valeur du contexte pour éviter les re-renders inutiles
  const contextValue = useMemo(() => {
    console.log('[AUTH/PROVIDER] Context value updated', {
      hasUser: !!stableUser,
      hasSession: !!stableSession,
      loading,
      initialized
    });
    return {
      user: stableUser,
      session: stableSession,
      loading,
      initialized
    };
  }, [stableUser, stableSession, loading, initialized]);

  return (
    <AuthContext.Provider value={contextValue}>
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

  // Charger depuis localStorage UNE SEULE FOIS (pas à chaque render)
  const cachedProfile = useMemo(() => {
    if (!user?.id) return undefined;
    try {
      const cached = localStorage.getItem(`profile_${user.id}`);
      return cached ? JSON.parse(cached) : undefined;
    } catch {
      return undefined;
    }
  }, [user?.id]);

  const query = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user?.id,
    initialData: cachedProfile, // Utiliser la valeur mémorisée
    staleTime: Infinity, // JAMAIS considéré comme stale - évite les refetch infinis
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  console.log('[PROFILE QUERY]', {
    userId: user?.id,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasData: !!query.data,
    hasCached: !!cachedProfile,
    status: query.status,
    fetchStatus: query.fetchStatus
  });

  return query;
}

export function useSubscription() {
  const { user } = useAuthContext();

  // Charger depuis localStorage UNE SEULE FOIS (pas à chaque render)
  const cachedSubscription = useMemo(() => {
    if (!user?.id) return undefined;
    try {
      const cached = localStorage.getItem(`subscription_${user.id}`);
      return cached ? JSON.parse(cached) : undefined;
    } catch {
      return undefined;
    }
  }, [user?.id]);

  const query = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: () => fetchSubscription(user!.id),
    enabled: !!user?.id,
    initialData: cachedSubscription, // Utiliser la valeur mémorisée
    staleTime: Infinity, // JAMAIS considéré comme stale - évite les refetch infinis
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  console.log('[SUBSCRIPTION QUERY]', {
    userId: user?.id,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasData: !!query.data,
    hasCached: !!cachedSubscription,
    status: query.status,
    fetchStatus: query.fetchStatus
  });

  return query;
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

export function useSignInWithGoogle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur de connexion avec Google');
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
      // Nettoyer le localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('profile_') || key.startsWith('subscription_')) {
          localStorage.removeItem(key);
        }
      });
      // Forcer une redirection explicite pour éviter tout état bloqué de guard
      try {
        if (typeof window !== 'undefined') {
          window.location.assign('/auth');
        }
      } catch {}
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

  // Mémoriser l'objet retourné pour éviter les re-renders en cascade
  // IMPORTANT: Dépendre des valeurs primitives, pas des objets entiers
  const userId = user?.id;
  const sessionAccessToken = session?.access_token;
  const profileId = profile?.id;
  const subscriptionId = subscription?.id;

  const result = useMemo(() => {
    // isReady = auth initialisée ET (profile/subscription chargés OU user n'existe pas)
    // Si pas de user, on est ready car pas besoin de charger profile/subscription
    const isReady = initialized && (!user || (!profileLoading && !subscriptionLoading));

    console.log('[USE_AUTH]', {
      hasUser: !!user,
      initialized,
      profileLoading,
      subscriptionLoading,
      hasProfile: !!profile,
      hasSubscription: !!subscription,
      isReady,
      timestamp: Date.now()
    });

    return {
      user,
      session,
      profile: profile ?? null,
      subscription: subscription ?? null,
      loading,
      initialized,
      isReady,
    };
  }, [userId, sessionAccessToken, profileId, subscriptionId, loading, initialized, profileLoading, subscriptionLoading]);

  return result;
}

// Hook utilitaire pour vérifier l'abonnement
export function useIsSubscribed() {
  const { subscription } = useAuth();

  if (!subscription) return false;

  const status = subscription.subscription_status?.toLowerCase() ?? '';
  return subscription.subscribed || status === 'active' || status === 'trialing';
}
