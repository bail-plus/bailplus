
import { useState } from 'react';
import { Navigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Building2 } from 'lucide-react';

export default function Login() {
  const { user, signIn, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const offerParam = searchParams.get('offer');
  
  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/offers" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const { error } = await signIn(email, password);
    if (!error) {
      console.log('✅ Login successful, redirecting to offers...');
      window.location.href = '/offers';
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            {offerParam 
              ? `Connectez-vous pour souscrire à l'offre ${offerParam.charAt(0).toUpperCase() + offerParam.slice(1)}`
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
              <Link to={`/signup${offerParam ? `?offer=${offerParam}` : ''}`} className="text-primary hover:underline">
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
