import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_status: string;
  subscription_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  subscription: SubscriptionInfo | null;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  subscription: null,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  checkSubscription: async () => {},
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({
        subscribed: false,
        subscription_tier: null,
        subscription_status: 'inactive',
        subscription_end: null
      });
    }
  };

  useEffect(() => {
    console.log('[AUTH] useAuth initialization started...');
    
    // Set up auth state listener - NO AUTOMATIC REDIRECTIONS
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AUTH] Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
        
        // Only update state, never redirect automatically
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          setSubscription(null);
          console.log('[AUTH] User signed out - cleared subscription');
        }
        
        // No automatic redirections - let components handle their own routing
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AUTH] Initial session check:', { hasSession: !!session, hasUser: !!session?.user });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      console.log('🔐 Starting signup process...', { email });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/offers`,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      
      console.log('🔐 Signup result:', { data, error, user: data?.user, session: data?.session });
      
      if (error) {
        console.error('❌ Signup error:', error);
        toast.error(error.message);
      } else if (data?.user) {
        if (data.session) {
          console.log('✅ User signed up with immediate session');
          toast.success('Compte créé avec succès !');
        } else {
          console.log('📧 User signed up, email confirmation required');
          toast.success('Compte créé ! Vérifiez vos emails pour confirmer votre adresse.');
        }
      }
      
      return { error };
    } catch (err) {
      console.error('❌ Signup catch error:', err);
      toast.error('Erreur lors de la création du compte');
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Connexion réussie !');
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Déconnexion réussie');
  };

  const value = {
    user,
    session,
    subscription,
    signUp,
    signIn,
    signOut,
    checkSubscription,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};