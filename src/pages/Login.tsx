import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { LoadingGate } from '@/components/LoadingGate';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false);

  // If user is already authenticated, check subscription and redirect accordingly
  useEffect(() => {
    const checkUserSubscription = async () => {
      if (user && !loading) {
        try {
          // Check if user has an active subscription
          const { data: subscriptionData, error } = await supabase
            .from('subscriptions')
            .select('subscribed, subscription_status')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('❌ Error checking subscription:', error);
            navigate('/offers', { replace: true });
            return;
          }

          if (subscriptionData?.subscribed && subscriptionData?.subscription_status === 'active') {
            navigate('/', { replace: true });
          } else {
            navigate('/offers', { replace: true });
          }
        } catch (error) {
          console.error('❌ Error during subscription check:', error);
          navigate('/offers', { replace: true });
        }
      }
    };

    checkUserSubscription();
  }, [user, loading, navigate]);

  // Set up auth state listener for immediate redirect after login
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in, checking subscription status...');
        
        try {
          // Check if user has an active subscription
          const { data: subscriptionData, error } = await supabase
            .from('subscriptions')
            .select('subscribed, subscription_status')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('❌ Error checking subscription:', error);
            // If error checking subscription, redirect to offers
            navigate('/offers');
            return;
          }

          if (subscriptionData?.subscribed && subscriptionData?.subscription_status === 'active') {
            console.log('✅ User has active subscription, redirecting to dashboard...');
            navigate('/');
          } else {
            console.log('❌ User has no active subscription, redirecting to offers...');
            navigate('/offers');
          }
        } catch (error) {
          console.error('❌ Error during subscription check:', error);
          navigate('/offers');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const { error } = await signIn(email, password);
    if (!error) {
      console.log('✅ Login successful, auth state change will handle redirect');
      setIsWaitingForAuth(true);
    }
    setIsLoading(false);
  };

  if (loading || isWaitingForAuth) {
    return (
      <LoadingGate 
        isLoading={true} 
        message={isWaitingForAuth ? "Connexion en cours..." : "Chargement..."}
      >
        <div />
      </LoadingGate>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Se connecter
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Connectez-vous pour accéder aux offres d'abonnement
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
            <CardDescription>
              Entrez vos informations de connexion
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="jean.dupont@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Votre mot de passe"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas de compte ?{' '}
                <Link 
                  to={`/signup${window.location.search}`}
                  className="text-primary hover:underline"
                >
                  Créez-en un
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}