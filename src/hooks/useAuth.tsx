import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { tr } from 'date-fns/locale';

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
    lastName: string,
    role: Role,
    trial_end_date: string | null,
    gender: Gender,
    birthdate: string | null,
    phone_number: string,
    adress: string,
    city: string,
    postal_code: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
  initialized: boolean;
}

/* =======================
   Contexte
   ======================= */
// 1) Ajoute ces imports utils en haut si tu veux des timestamps lisibles
const ts = () => new Date().toISOString().slice(11, 19); // HH:MM:SS
const LG = (...a: any[]) => console.log(`[AUTH ${ts()}]`, ...a);

export type Gender = 'male' | 'female' | 'other';
export type Role = 'admin' | 'user' | 'trial';

/// en haut de useAuth.tsx (hors composant)
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
  } else {
    // ✅ hydrate immédiatement pour éviter "hasProfile: false"
    // (déplace 'setProfile' ici si la fonction est hors composant → voir option ci-dessous)
    console.log('upsertProfileFromUser OK →', data);

  }
};


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
  initialized: false,
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
  //const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);


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
  // const refreshProfile = async () => {
  //   if (!user?.id) return;
  //   setLoading(true);
  //   try {
  //     await fetchProfile(user.id);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const refreshProfile = async () => {
    if (!user?.id) return;
    await fetchProfile(user.id);
  };

  useEffect(() => {
    let cancelled = false;
    let hydrated = false; // évite la course entre getSession et le listener

    // --- 1) Listener Auth (arrive aussi bien au boot qu'après login) ---
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      LG('onAuthStateChange event =', event);
      if (cancelled) return;

      setSession(session ?? null);
      const u = session?.user ?? null;
      setUser(u);

      // ⚑ On déclare l'app "hydratée" dès le premier event
      if (!hydrated) {
        hydrated = true;
        setInitialized(true);
      }

      // if (u?.id && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
      //   setLoading(true);
      //   try {
      //     await upsertProfileFromUser(u);
      //     await Promise.all([fetchProfile(u.id), loadSubscription(u.id)]);
      //   } catch (e) {
      //     console.error('auth hydrate error', e);
      //   } finally {
      //     setLoading(false);
      //   }
      // }
      if (u?.id && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
        try {
          await upsertProfileFromUser(u);
          await Promise.all([fetchProfile(u.id), loadSubscription(u.id)]);
        } catch (e) {
          console.error('auth hydrate error', e);
        }
      }

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setSubscription(null);
        setLoading(false);
      }
    });

    // --- 2) Hydratation initiale (au cas où aucun event n'arrive tout de suite) ---
    (async () => {
      LG('init effect start → setLoading(true)');
      //setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) console.error('getSession error', error);

        const sess = data?.session ?? null;
        const u = sess?.user ?? null;

        setSession(sess);
        setUser(u);

        // Quoi qu’il arrive, on débloque l’UI
        if (!hydrated) {
          hydrated = true;
          setInitialized(true);
        }

        if (u?.id) {
          // charge en arrière-plan
          fetchProfile(u.id).catch(console.error);
          loadSubscription(u.id).catch(console.error);
        } else {
          setProfile(null);
          setSubscription(null);
        }
      } catch (e) {
        console.error('getSession exception', e);
        setProfile(null);
        setSubscription(null);
        if (!hydrated) {
          hydrated = true;
          setInitialized(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          LG('init effect end');
        }
      }
    })();

    // --- 3) Safety: ne jamais rester bloqué > 2s même si tout plante ---
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






  const signUp = async (email: string, password: string, firstName: string, lastName: string, role: Role, trial_end_date: string | null, gender: Gender,
    birthdate: string | null, phone_number: string, adress: string, city: string, postal_code: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName, last_name: lastName, role: role, trial_end_date: trial_end_date, gender: gender, birthdate: birthdate, phone_number: phone_number, adress: adress, city: city, postal_code: postal_code },
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
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return { error }; }
    toast.success('Connexion réussie !');

    // 🔎 Vérification immédiate de persistance
    console.log('[AUTH/SIGNIN RESULT]', { hasSession: !!data?.session });
    console.log('[AUTH/LOCALSTORAGE KEYS]', Object.keys(localStorage));
    console.log('[AUTH/STORED TOKEN]', localStorage.getItem(Object.keys(localStorage).find(k => k.includes('sb-') && k.includes('-auth-token')) || ''));

    // Double-check via SDK
    const after = await supabase.auth.getSession();
    console.log('[AUTH/GET_SESSION AFTER SIGNIN]', { restored: !!after.data.session });

    const u = data.session?.user;
    if (u?.id) {
      await upsertProfileFromUser(u);
      await Promise.all([fetchProfile(u.id), loadSubscription(u.id)]);
    }
    setLoading(false);
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
      initialized,
    }),
    [user, session, profile, subscription, loading, initialized]
  );
  // Logs synthétiques à chaque render de provider
  LG('render provider →',
    {
      user: !!user, loading, initialized,
      hasProfile: !!profile, sub: subscription?.status
    });

  console.log('[AUTH] mount init');

  console.log('[AUTH] getSession done', !!session?.user);

  //console.log('[AUTH] fetchProfile done', !!data);

  console.log('[AUTH] setLoading(false) init');
  console.log('[AUTH] initialized:', initialized, 'loading:', loading, 'user:', user);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
