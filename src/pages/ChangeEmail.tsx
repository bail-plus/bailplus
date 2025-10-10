import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth, useUpdateEmail } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function ChangeEmail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const updateEmail = useUpdateEmail();
  const [emailUpdated, setEmailUpdated] = useState(false);

  // Si pas connecté, rediriger vers auth
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newEmail = formData.get('newEmail') as string;
    const confirmEmail = formData.get('confirmEmail') as string;

    if (newEmail !== confirmEmail) {
      alert('Les adresses email ne correspondent pas');
      return;
    }

    if (!newEmail.includes('@')) {
      alert('Veuillez entrer une adresse email valide');
      return;
    }

    updateEmail.mutate(newEmail, {
      onSuccess: () => {
        setEmailUpdated(true);
      }
    });
  };

  if (emailUpdated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Email de confirmation envoyé
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Vérifiez votre nouvelle boîte mail
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500 mr-2" />
                Confirmation requise
              </CardTitle>
              <CardDescription>
                Un email de confirmation a été envoyé à votre nouvelle adresse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pour finaliser le changement d'adresse email, cliquez sur le lien de confirmation dans l'email que nous venons de vous envoyer.
              </p>
              <Button
                onClick={() => navigate('/app/settings')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux paramètres
              </Button>
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
            Changer d'adresse email
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Email actuel : {user.email}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nouvelle adresse email</CardTitle>
            <CardDescription>
              Vous recevrez un email de confirmation à votre nouvelle adresse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Nouvelle adresse email</Label>
                <Input
                  id="newEmail"
                  name="newEmail"
                  type="email"
                  required
                  placeholder="nouvelle@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Confirmer la nouvelle adresse</Label>
                <Input
                  id="confirmEmail"
                  name="confirmEmail"
                  type="email"
                  required
                  placeholder="nouvelle@example.com"
                />
              </div>

              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Après validation, vous devrez confirmer votre nouvelle adresse email en cliquant sur le lien envoyé.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={updateEmail.isPending}
              >
                {updateEmail.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  'Changer d\'adresse email'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/app/settings')}
                className="text-sm"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
