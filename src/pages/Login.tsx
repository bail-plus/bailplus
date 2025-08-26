
import { useState, useEffect } from 'react';
import { Navigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Building2 } from 'lucide-react';
import { LoadingGate } from '@/components/LoadingGate';
import { getSubscriptionIntent, getIntentFromParams } from '@/lib/subscription-intent';

export default function Login() {
  const { user, signIn, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false);
  
  // Get intent information
  const urlIntent = getIntentFromParams(searchParams);
  const storedIntent = getSubscriptionIntent();
  const hasIntent = !!(urlIntent || storedIntent);

  // Only redirect if user is authenticated AND there's no intent to process
  if (user && !hasIntent) {
    return <Navigate to="/offers" replace />;
  }

  // Handle auto-redirect after successful login
  useEffect(() => {
    if (user && hasIntent) {
      console.log('👤 User logged in with subscription intent, redirecting to offers...');
      setIsWaitingForAuth(true);
      // Redirect to offers page where the intent will be processed
      setTimeout(() => {
        window.location.href = '/offers';
      }, 1000);
    }
  }, [user, hasIntent]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const { error } = await signIn(email, password);
    if (!error) {
      console.log('✅ Login successful');
      if (hasIntent) {
        console.log('🔄 Will redirect to offers to process subscription intent');
        setIsWaitingForAuth(true);
      } else {
        window.location.href = '/offers';
      }
    }
    setIsLoading(false);
  };

  if (loading || isWaitingForAuth) {
    return (
      <LoadingGate 
        isLoading={true} 
        message={isWaitingForAuth ? "Redirection vers votre abonnement..." : "Chargement..."}
      >
        <div />
      </LoadingGate>
    );
  }

  // Determine display text based on intent
  const getIntentDisplayText = () => {
    const intent = urlIntent || storedIntent;
    if (!intent) return null;
    
    const tierNames = {
      starter: 'Starter',
      pro: 'Pro', 
      enterprise: 'Enterprise'
    };
    
    return tierNames[intent.tier] || intent.tier;
  };

  const intentDisplayText = getIntentDisplayText();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Se connecter</CardTitle>
          <CardDescription>
            {intentDisplayText 
              ? `Connectez-vous pour souscrire à l'offre ${intentDisplayText}`
              : 'Connectez-vous à votre compte BailloGenius'
            }
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
                placeholder="votre@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to={`/signup${urlIntent ? `?${new URLSearchParams({ intent: 'subscribe', priceId: urlIntent.priceId, tier: urlIntent.tier }).toString()}` : ''}`} className="text-primary hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <Link to="/offers" className="text-sm text-muted-foreground hover:text-foreground">
              ← Voir les offres
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
