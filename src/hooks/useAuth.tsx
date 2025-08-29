import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  entity_id: string | null;
  role: string | null;
  trial_end_date: string | null; // stocké en DATE => "YYYY-MM-DD"
  gender?: string | null;
  birthdate?: string | null;
  phone_number?: string | null;
  adress?: string | null;
  city?: string | null;
  postal_code?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_status: string;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;

  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,

  profile: null,
  refreshProfile: async () => { },
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => { },
  checkSubscription: async () => { },
  loading: true,
});

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /** Charge le profil pour un user donné */
  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')               // ← adapte si ta table s’appelle autrement
      .select('*')
      .eq('user_id', uid)
      .single();

    if (error) {
      // 406/No Rows: la ligne n’existe pas encore
      if (error.code !== 'PGRST116' && error.code !== '406') {
        console.error('fetchProfile error', error);
      }
      setProfile(null);
      return;
    }
    setProfile(data as Profile);
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  // 1) État initial (session existante)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  // 2) Écoute des changements d’auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session ?? null);
        const newUser = session?.user ?? null;
        setUser(newUser);

        if (newUser?.id) {
          await fetchProfile(newUser.id);
        } else {
          setProfile(null);

        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName, last_name: lastName }, // user_metadata (optionnel)
      }
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Compte créé avec succès ! Vérifiez vos emails.');
    }

    // ⚠️ Si tu exiges la vérification d’email, il n’y aura pas de session tout de suite.
    // La ligne "profile" peut être créée via trigger côté DB, ou après la première connexion.
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      return { error };
    }
    toast.success('Connexion réussie !');

    // Session/Utilisateur mis à jour par le listener; on peut aussi forcer un fetch
    if (data.session?.user?.id) await fetchProfile(data.session.user.id);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    toast.success('Déconnexion réussie');
  };


  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      refreshProfile,
      signUp,
      signIn,
      signOut,
      loading,
    }),
    [user, session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
