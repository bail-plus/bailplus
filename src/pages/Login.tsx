import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth, useSignIn } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { LoadingGate } from '@/components/LoadingGate';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const signIn = useSignIn();
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false);

  // If user is already authenticated, redirect to offers
  if (user && !loading) {
    return <Navigate to="/offers" replace />;
  }

  // Set up auth state listener for immediate redirect after login
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });

      if (event === 'SIGNED_IN') {
        console.log('✅ User signed in, redirecting to offers...');
        navigate('/offers');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    signIn.mutate({ email, password }, {
      onSuccess: () => {
        console.log('✅ Login successful, auth state change will handle redirect');
        setIsWaitingForAuth(true);
      }
    });
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
                disabled={signIn.isPending}
              >
                {signIn.isPending ? (
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
