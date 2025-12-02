import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useUpdatePassword } from '@/hooks/auth/useAuth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const updatePassword = useUpdatePassword();
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    updatePassword.mutate(newPassword, {
      onSuccess: () => {
        setPasswordUpdated(true);
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    });
  };

  if (passwordUpdated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Mot de passe mis à jour
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Vous allez être redirigé vers la page de connexion
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
                Succès
              </CardTitle>
              <CardDescription>
                Votre mot de passe a été mis à jour avec succès
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Vous serez redirigé automatiquement dans quelques secondes...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Nouveau mot de passe
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Réinitialisation du mot de passe</CardTitle>
            <CardDescription>
              Entrez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  placeholder="Minimum 6 caractères"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Répétez le mot de passe"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={updatePassword.isPending}
              >
                {updatePassword.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
