
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Building2 } from 'lucide-react';

export default function Signup() {
  const { user, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated - check subscription status
  if (user) {
    return <Navigate to="/offers" replace />;
  }

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
      // Redirect to offers page after successful signup
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
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>Rejoignez BailloGenius et simplifiez votre gestion locative</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="Jean"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  name="lastName"
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
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer un compte'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
          
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
