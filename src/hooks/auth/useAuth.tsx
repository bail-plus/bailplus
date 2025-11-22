import { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
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
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  initialized: boolean;
  isReady: boolean;
  refreshProfile: () => Promise<Profile | null>;
  refreshSubscription: () => Promise<Subscription | null>;
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

  // Vérifier si le profil existe déjà
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', u.id)
    .single();

  // Si le profil existe déjà, ne rien faire (ne pas écraser les données)
  if (existingProfile) {
    return existingProfile;
  }

  // Le profil n'existe pas, on le crée

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
    user_type: md.user_type ?? 'LANDLORD',
    trial_end_date: trialEndDate,
    gender: md.gender ?? null,
    birthdate: toDateOnly(md.birthdate),
    phone_number: md.phone_number ?? null,
    adress: md.adress ?? null,
    city: md.city ?? null,
    postal_code: postalCodeNumber,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert(payload as any)
    .select()
    .single();

  if (error) {
    console.error('❌ [AUTH] Erreur création profil:', error);
    throw error;
  }

  return data;
};

/* =======================
   API Functions
   ======================= */
async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    // Timeout de 5 secondes pour éviter les requêtes bloquées
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('fetchProfile timeout after 5s')), 5000);
    });

    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      // Si erreur réseau, lancer une exception pour que React Query retry
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Load failed')) {
        throw error;
      }
      console.error('❌ [AUTH] Erreur chargement profil:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ [AUTH] Exception profil:', err);
    throw err; // Laisser React Query gérer le retry
  }
}

async function fetchSubscription(userId: string): Promise<Subscription | null> {
  try {
    // Timeout de 5 secondes pour éviter les requêtes bloquées
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('fetchSubscription timeout after 5s')), 5000);
    });

    const fetchPromise = supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      // Si erreur réseau, lancer une exception pour que React Query retry
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Load failed')) {
        throw error;
      }
      console.error('❌ [AUTH] Erreur chargement abonnement:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ [AUTH] Exception abonnement:', err);
    throw err; // Laisser React Query gérer le retry
  }
}

async function signUpUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  user_type?: 'LANDLORD' | 'SERVICE_PROVIDER' | 'TENANT';
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
    user_type = 'LANDLORD',
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
      emailRedirectTo: `${window.location.origin}/app`,
      data: {
        first_name: firstName,
        last_name: lastName,
        role,
        user_type,
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
      redirectTo: `${window.location.origin}/select-user-type?oauth=true`,
    }
  });
  if (error) throw error;
  return data;
}

async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

async function resetPasswordRequest(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return { success: true };
}

async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
  return { success: true };
}

async function updateEmail(newEmail: string) {
  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });
  if (error) throw error;
  return { success: true };
}

/* =======================
   Context
   ======================= */
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  subscription: null,
  loading: true,
  initialized: false,
  isReady: false,
  refreshProfile: async () => null,
  refreshSubscription: async () => null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let isActive = true;
    let hydrated = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!isActive) return;

      const currentSession = nextSession ?? null;
      const currentUser = currentSession?.user ?? null;

      setSession(currentSession);
      setUser(currentUser);

      // Créer le profil uniquement lors de la première connexion (pas lors des reconnexions)
      if (currentUser?.id && event === 'SIGNED_IN' && !hydrated) {
        try {
          await upsertProfileFromUser(currentUser);
        } catch (error) {
          console.error('❌ [AUTH] Erreur lors de la création du profil après connexion:', error);
        }
      }

      if (event === 'SIGNED_OUT') {
        queryClient.removeQueries({ queryKey: ['profile'] });
        queryClient.removeQueries({ queryKey: ['subscription'] });
      } else if (event === 'SIGNED_IN' && !hydrated) {
        // Invalider uniquement lors de la première connexion, pas lors des reconnexions
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }

      if (!hydrated) {
        hydrated = true;
        // Petit délai pour laisser la session JWT se propager
        setTimeout(() => {
          if (isActive) {
            setAuthReady(true);
          }
        }, 200);
      }
    });

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isActive) return;

        if (error) {
          console.error('❌ [AUTH] Erreur getSession:', error);
        }

        const initialSession = data?.session ?? null;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (err) {
        if (isActive) {
          console.error('❌ [AUTH] Exception getSession:', err);
        }
      } finally {
        if (isActive && !hydrated) {
          hydrated = true;
          // Petit délai pour laisser la session JWT se propager
          setTimeout(() => {
            if (isActive) {
              setAuthReady(true);
            }
          }, 200);
        }
      }
    })();

    const safetyTimeout = setTimeout(() => {
      if (isActive && !hydrated) {
        hydrated = true;
        setAuthReady(true);
      }
    }, 2000);

    return () => {
      isActive = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Log pour détecter les changements de user.id
  useEffect(() => {
    if (import.meta.env.DEV) {
    }
  }, [user?.id]);

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    enabled: false, // Désactivé par défaut, on lance manuellement
    queryFn: () => {
      return fetchProfile(user!.id);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    enabled: false, // Désactivé par défaut, on lance manuellement
    queryFn: () => {
      return fetchSubscription(user!.id);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Lancer les queries manuellement après que authReady soit true + délai de sécurité
  useEffect(() => {
    if (authReady && user?.id && !profileQuery.data && !profileQuery.isFetching) {
      const timer = setTimeout(() => {
        profileQuery.refetch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authReady, user?.id, profileQuery]);

  useEffect(() => {
    if (authReady && user?.id && !subscriptionQuery.data && !subscriptionQuery.isFetching) {
      const timer = setTimeout(() => {
        subscriptionQuery.refetch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authReady, user?.id, subscriptionQuery]);

  const profileData = profileQuery.data ?? null;
  const subscriptionData = subscriptionQuery.data ?? null;

  const hasUser = !!user?.id;
  const profileReady = !hasUser || profileQuery.isFetched || profileQuery.isError;
  const subscriptionReady = !hasUser || subscriptionQuery.isFetched || subscriptionQuery.isError;

  const loading = !authReady || !profileReady || !subscriptionReady;
  const isReady = authReady && profileReady && subscriptionReady;

  // Supprimé: useEffect en double qui lançait les queries trop tôt

  // Debug: log quand on reste bloqué
  if (import.meta.env.DEV && authReady && (!profileReady || !subscriptionReady)) {
      authReady,
      hasUser,
      userId: user?.id,
      profileReady,
      subscriptionReady,
      profileStatus: profileQuery.status,
      profileFetching: profileQuery.isFetching,
      profileError: profileQuery.error,
      profileEnabled: authReady && !!user?.id,
      subscriptionStatus: subscriptionQuery.status,
      subscriptionFetching: subscriptionQuery.isFetching,
      subscriptionError: subscriptionQuery.error,
      subscriptionEnabled: authReady && !!user?.id,
    });
  }

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return null;
    const result = await profileQuery.refetch();
    if (result.error) {
      console.error('❌ [AUTH] Erreur lors du rafraîchissement du profil:', result.error);
    }
    return result.data ?? profileData ?? null;
  }, [user?.id, profileQuery, profileData]);

  const refreshSubscription = useCallback(async () => {
    if (!user?.id) return null;
    const result = await subscriptionQuery.refetch();
    if (result.error) {
      console.error('❌ [AUTH] Erreur lors du rafraîchissement de l\'abonnement:', result.error);
    }
    return result.data ?? subscriptionData ?? null;
  }, [user?.id, subscriptionQuery, subscriptionData]);

  const contextValue = useMemo(() => ({
    user,
    session,
    profile: profileData,
    subscription: subscriptionData,
    loading,
    initialized: authReady,
    isReady,
    refreshProfile,
    refreshSubscription,
  }), [user, session, profileData, subscriptionData, loading, authReady, isReady, refreshProfile, refreshSubscription]);

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

export function useSignUp() {
  return useMutation({
    mutationFn: signUpUser,
    onSuccess: () => {
      toast.success('Compte créé avec succès ! Vérifiez vos emails.');
    },
    onError: (error: any) => {
      // Messages d'erreur personnalisés selon le type d'erreur
      if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
        toast.error('Cette adresse email est déjà utilisée');
      } else if (error.message?.includes('Email rate limit exceeded')) {
        toast.error('Trop de tentatives. Veuillez réessayer dans quelques minutes.');
      } else if (error.message?.includes('Password')) {
        toast.error('Le mot de passe doit contenir au moins 6 caractères');
      } else {
        toast.error(error.message || 'Erreur lors de la création du compte');
      }
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

export function useResetPasswordRequest() {
  return useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: () => {
      toast.success('Un email de réinitialisation a été envoyé !');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      toast.success('Mot de passe mis à jour avec succès !');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe');
    },
  });
}

export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmail,
    onSuccess: () => {
      toast.success('Un email de confirmation a été envoyé à votre nouvelle adresse !');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la mise à jour de l\'email');
    },
  });
}

export function useAuth() {
  return useAuthContext();
}

// Hook utilitaire pour vérifier l'abonnement
export function useIsSubscribed() {
  const { subscription } = useAuth();

  if (!subscription) return false;

  const status = subscription.subscription_status?.toLowerCase() ?? '';
  return subscription.subscribed || status === 'active' || status === 'trialing';
}
