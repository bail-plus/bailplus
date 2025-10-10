import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useResetPasswordRequest } from '@/hooks/useAuth';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const resetPasswordRequest = useResetPasswordRequest();
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    resetPasswordRequest.mutate(email, {
      onSuccess: () => {
        setEmailSent(true);
      }
    });
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Email envoyé
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Vérifiez votre boîte mail
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vérifiez vos emails</CardTitle>
              <CardDescription>
                Un email contenant un lien de réinitialisation a été envoyé à votre adresse.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si vous ne recevez pas l'email dans quelques minutes, vérifiez votre dossier de spam.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
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
            Mot de passe oublié
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Entrez votre email pour réinitialiser votre mot de passe
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Réinitialisation</CardTitle>
            <CardDescription>
              Nous vous enverrons un lien de réinitialisation par email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button
                type="submit"
                className="w-full"
                disabled={resetPasswordRequest.isPending}
              >
                {resetPasswordRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:underline inline-flex items-center"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
