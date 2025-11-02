// src/pages/Auth.tsx
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth, useSignIn, useSignUp, useSignInWithGoogle, Gender, Role } from '@/hooks/auth/useAuth';

export default function Auth() {
  const { user, loading } = useAuth();
  const signIn = useSignIn();
  const signUp = useSignUp();
  const signInWithGoogle = useSignInWithGoogle();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Déjà authentifié → redirect
  if (user) return <Navigate to="/app" replace />;

  const handleGoogleSignIn = () => {
    signInWithGoogle.mutate();
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get('email') ?? '').trim();
      const password = String(fd.get('password') ?? '');

      signIn.mutate({ email, password }, {
        onError: (error) => {
          console.error('❌ Erreur connexion:', error);
        },
        onSettled: () => setIsLoading(false)
      });
    } catch (err) {
      console.error('❌ Exception connexion:', err);
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const fd = new FormData(e.currentTarget);

      const email = String(fd.get('email') ?? '').trim();
      const password = String(fd.get('password') ?? '');
      const firstName = String(fd.get('firstName') ?? '').trim();
      const lastName = String(fd.get('lastName') ?? '').trim();

      // Champs ajoutés
      const role: Role = 'trial';
      const gender = (String(fd.get('gender') ?? 'other') as Gender);

      const birthdateStr = String(fd.get('birthdate') ?? ''); // "YYYY-MM-DD"
      const birthdate = birthdateStr || null;

      const phone_number = String(fd.get('phone_number') ?? '').trim();
      const adress = String(fd.get('adress') ?? '').trim();
      const city = String(fd.get('city') ?? '').trim();
      const postal_code = String(fd.get('postal_code') ?? '').trim();

      // trial_end_date = today + 8 jours
      const trial = new Date();
      trial.setDate(trial.getDate() + 8);
      const trial_end_date = trial.toISOString().slice(0, 10); // "YYYY-MM-DD"

      signUp.mutate({
        email,
        password,
        firstName,
        lastName,
        role,
        trial_end_date,
        gender,
        birthdate,
        phone_number,
        adress,
        city,
        postal_code
      }, {
        onError: (error) => {
          console.error('❌ Erreur inscription:', error);
        },
        onSettled: () => setIsLoading(false)
      });
    } catch (err) {
      console.error('❌ Exception inscription:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Connectez-vous à votre compte BailoGenius</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" name="email" type="email" required placeholder="vous@exemple.com" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || signIn.isPending}>
                  {isLoading || signIn.isPending ? 'Connexion…' : 'Se connecter'}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={signInWithGoogle.isPending}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </Button>
              </form>

              <div className="mt-4 space-y-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Pas encore de compte ?{' '}
                  <Link to="/select-user-type" className="text-primary hover:underline font-medium">
                    Créer un compte
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  Vous n'avez plus accès à votre adresse email ?{' '}
                  <Link to="/lost-email-access" className="text-primary hover:underline">
                    Contactez le support
                  </Link>
                </p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
