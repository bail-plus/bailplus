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

export default function Signup() {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false);

  // If user is already authenticated, redirect to offers
  if (user && !loading) {
    return <Navigate to="/offers" replace />;
  }

  // Set up auth state listener for immediate redirect after signup
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });
      
      if (event === 'SIGNED_IN') {
        console.log('✅ User signed up, checking redirect parameter...');
        
        // Check if user should be redirected to Stripe checkout
        const redirectParam = searchParams.get('redirect');
        if (redirectParam === 'stripe') {
          console.log('🔄 Redirecting to Stripe checkout...');
          // Redirect to Stripe checkout URL
          const stripeCheckoutUrl = "https://buy.stripe.com/3cIbJ105K5iW6Yp4PV1Jm00";
          window.location.href = stripeCheckoutUrl;
        } else {
          // Default redirect to offers
          navigate('/offers');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, searchParams]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    
    const { error } = await signUp(email, password, firstName, lastName);
    if (!error) {
      console.log('✅ Signup successful, auth state change will handle redirect');
      setIsWaitingForAuth(true);
    }
    setIsLoading(false);
  };

  if (loading || isWaitingForAuth) {
    return (
      <LoadingGate 
        isLoading={true} 
        message={isWaitingForAuth ? "Création de votre compte..." : "Chargement..."}
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
            Créer un compte
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Créez votre compte pour accéder aux offres d'abonnement
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Remplissez vos informations pour créer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Dupont"
                  />
                </div>
              </div>
              
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
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{' '}
                <Link 
                  to={`/login${window.location.search}`}
                  className="text-primary hover:underline"
                >
                  Connectez-vous
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}