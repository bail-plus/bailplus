import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/* =======================
   Types
   ======================= */
type Profile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  entity_id: string | null;
  role: string | null;               // "admin" | "user" | "trial" | ...
  trial_end_date: string | null;     // "YYYY-MM-DD" (DATE)
  gender?: string | null;
  birthdate?: string | null;
  phone_number?: string | null;
  adress?: string | null;
  city?: string | null;
  postal_code?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SubscriptionState = {
  subscribed: boolean;
  status: string;                     // ex: 'active', 'trialing', ...
  current_period_end?: string | null; // ISO ou date string si présent
};

interface AuthContextType {
  user: User | null;
  session: Session | null;

  profile: Profile | null;
  subscription: SubscriptionState | null;

  refreshProfile: () => Promise<void>;
  checkSubscription: () => Promise<void>;

  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;

  loading: boolean;
}

/* =======================
   Contexte
   ======================= */
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  subscription: null,
  refreshProfile: async () => { },
  checkSubscription: async () => { },
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => { },
  loading: true,
});

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/* =======================
   Provider
   ======================= */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);

  /** Charge le profil pour un user donné (table: profiles) */
  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (error) {
        // 406/PGRST116: pas de ligne
        if (error.code !== 'PGRST116' && error.code !== '406') {
          console.error('fetchProfile error', error);
        }
        setProfile(null);
        return;
      }
      setProfile(data as Profile);
    } catch (e) {
      console.error('fetchProfile exception', e);
      setProfile(null);
    }
  };

  /** Charge l’état d’abonnement (table: subscriptions), tolérant aux noms de colonnes
   *  et RETOURNE l’état calculé pour éviter l’état stale côté appelant.
   */
  const loadSubscription = async (uid: string): Promise<SubscriptionState | null> => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('loadSubscription error', error);
        setSubscription(null);
        return null;
      }

      const row: Record<string, any> = data ?? {};
      const rawStatus: string =
        row.status ??
        row.stripe_status ??
        row.subscription_status ??
        row.state ??
        'none';

      const status = String(rawStatus).toLowerCase();

      const current_period_end: string | null =
        row.current_period_end ??
        row.current_period_ends_at ??
        row.period_end ??
        row.cancel_at ??
        row.ended_at ??
        null;

      const isActive = status === 'active' || status === 'trialing';

      const nextState: SubscriptionState = {
        subscribed: isActive,
        status,
        current_period_end,
      };
      setSubscription(nextState);
      return nextState;
    } catch (e) {
      console.error('loadSubscription exception', e);
      setSubscription(null);
      return null;
    }
  };

  /** Vérifie l’abonnement en le rechargeant (pas d’état stale) */
  const checkSubscription = async () => {
    if (!user?.id) return;
    const s = await loadSubscription(user.id);
    if (s && !s.subscribed) {
      toast.info("Votre abonnement n'est pas actif.");
    }
  };

  /** Rafraîchit uniquement le profil */
  const refreshProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      await fetchProfile(user.id);
    } finally {
      setLoading(false);
    }
  };

  /** Init au montage */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        setSession(session ?? null);
        const u = session?.user ?? null;
        setUser(u);

        if (u?.id) {
          await fetchProfile(u.id);
          await loadSubscription(u.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
      } catch (e) {
        console.error('getSession exception', e);
        setProfile(null);
        setSubscription(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /** Écoute des changements d’auth (login/logout/refresh) */
  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        try {
          setSession(session ?? null);
          const u = session?.user ?? null;
          setUser(u);

          if (u?.id) {
            await fetchProfile(u.id);
            await loadSubscription(u.id);
          } else {
            setProfile(null);
            setSubscription(null);
          }
        } catch (e) {
          console.error('onAuthStateChange exception', e);
          setProfile(null);
          setSubscription(null);
        } finally {
          setLoading(false);
        }
      }
    );
    return () => authSub.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName, last_name: lastName },
      }
    });

    if (error) {
      toast.error(error.message);
      return { error };
    }

    toast.success('Compte créé avec succès ! Vérifiez vos emails.');
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return { error };
    }
    toast.success('Connexion réussie !');

    if (data.session?.user?.id) {
      await fetchProfile(data.session.user.id);
      await loadSubscription(data.session.user.id);
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSubscription(null);
    toast.success('Déconnexion réussie');
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      subscription,
      refreshProfile,
      checkSubscription,
      signUp,
      signIn,
      signOut,
      loading,
    }),
    [user, session, profile, subscription, loading]
  );
  console.log('[AUTH] mount init');

  console.log('[AUTH] getSession done', !!session?.user);

  //console.log('[AUTH] fetchProfile done', !!data);

  console.log('[AUTH] setLoading(false) init');


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
