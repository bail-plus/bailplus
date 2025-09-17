// src/pages/Auth.tsx
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, Gender, Role } from '@/hooks/useAuth';

export default function Auth() {
  const { user, signIn, signUp, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Déjà authentifié → redirect
  if (user) return <Navigate to="/app" replace />;

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get('email') ?? '').trim();
      const password = String(fd.get('password') ?? '');

      console.log('[AUTH/UI] submit signIn', { email, hasPassword: password.length > 0, loadingFromCtx: loading });

      const { error } = await signIn(email, password); // renvoie { error }
      if (error) {
        console.warn('[AUTH/UI] signIn error', error);
      } else {
        console.log('[AUTH/UI] signIn OK');
      }
    } catch (err) {
      console.error('[AUTH/UI] handleSignIn exception', err);
    } finally {
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
      const adress = String(fd.get('adress') ?? '').trim(); // orthographe alignée avec ta DB
      const city = String(fd.get('city') ?? '').trim();
      const postal_code = String(fd.get('postal_code') ?? '').trim();

      // trial_end_date = today + 8 jours
      const trial = new Date();
      trial.setDate(trial.getDate() + 8);
      const trial_end_date = trial.toISOString().slice(0, 10); // "YYYY-MM-DD"

      console.log('[AUTH/UI] submit signUp', { email, hasPassword: password.length > 0, role, gender, birthdate, phone_number, adress, city, postal_code, trial_end_date });

      const { error } = await signUp(
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
      );

      if (error) {
        console.warn('[AUTH/UI] signUp error', error);
      } else {
        console.log('[AUTH/UI] signUp OK');
      }
    } catch (err) {
      console.error('[AUTH/UI] handleSignUp exception', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Gestion Locative</CardTitle>
          <CardDescription>Connectez-vous ou créez votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            {/* ---- Connexion ---- */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" name="email" type="email" required placeholder="vous@exemple.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <Input id="signin-password" name="password" type="password" required placeholder="••••••••" />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Connexion…' : 'Se connecter'}
                </Button>

                <div className="text-xs text-muted-foreground">
                  useAuth.loading = {String(loading)}
                </div>
              </form>
            </TabsContent>

            {/* ---- Inscription ---- */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" name="firstName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" name="lastName" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" name="email" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input id="signup-password" name="password" type="password" required />
                </div>

                {/* Genre & Date de naissance */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Genre</Label>
                    <select id="gender" name="gender" className="w-full border rounded-md h-10 px-3">
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Date de naissance</Label>
                    <Input id="birthdate" name="birthdate" type="date" />
                  </div>
                </div>

                {/* Coordonnées */}
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Téléphone</Label>
                  <Input id="phone_number" name="phone_number" type="tel" placeholder="XXXXXXXXXX" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adress">Adresse</Label>
                  <Input id="adress" name="adress" placeholder="" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" name="city" placeholder="" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input id="postal_code" name="postal_code" placeholder="" />
                  </div>
                </div>

                {/* trial_end_date → today + 8 jours (calculé côté UI, pas d'input) */}
                <div className="text-xs text-muted-foreground">
                  La période d’essai se termine automatiquement dans <b>7 jours</b>.
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Création…" : "Créer un compte"}
                </Button>

                {/* <div className="text-xs text-muted-foreground">
                  useAuth.loading = {String(loading)}
                </div> */}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
