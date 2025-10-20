import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function LostEmailAccess() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const oldEmail = formData.get('oldEmail') as string;
    const newEmail = formData.get('newEmail') as string;
    const fullName = formData.get('fullName') as string;
    const message = formData.get('message') as string;

    // Simuler l'envoi (dans un vrai projet, vous enverriez ça à votre backend)
    setTimeout(() => {
      console.log('Demande de changement d\'email:', { oldEmail, newEmail, fullName, message });
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast.success('Votre demande a été envoyée !');
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-3xl font-bold text-foreground mt-4">
              Demande envoyée
            </h2>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Notre équipe va traiter votre demande
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Demande reçue</CardTitle>
              <CardDescription>
                Nous avons bien reçu votre demande de changement d'email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Notre équipe support va vérifier votre identité et traiter votre demande dans les plus brefs délais.
                  Vous recevrez une réponse à votre nouvelle adresse email.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Délai de traitement :</strong> 24-48 heures ouvrées
              </p>
              <Link to="/auth">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
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
          <AlertCircle className="mx-auto h-12 w-12 text-orange-500" />
          <h2 className="text-3xl font-bold text-foreground mt-4">
            Accès perdu à votre email
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Contactez notre support pour changer votre adresse email
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demande de changement d'email</CardTitle>
            <CardDescription>
              Remplissez ce formulaire pour nous contacter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oldEmail">Ancienne adresse email (inaccessible)</Label>
                <Input
                  id="oldEmail"
                  name="oldEmail"
                  type="email"
                  required
                  placeholder="ancien@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newEmail">Nouvelle adresse email</Label>
                <Input
                  id="newEmail"
                  name="newEmail"
                  type="email"
                  required
                  placeholder="nouveau@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Détails de la demande</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  placeholder="Expliquez pourquoi vous n'avez plus accès à votre ancien email et fournissez des informations pour vérifier votre identité..."
                  rows={5}
                />
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Note :</strong> Pour des raisons de sécurité, notre équipe devra vérifier votre identité avant de procéder au changement. Veuillez fournir le maximum d'informations dans votre message.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer la demande'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link
                to="/auth"
                className="text-sm text-primary hover:underline inline-flex items-center"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Retour à la connexion
              </Link>
              <p className="text-xs text-muted-foreground">
                Vous avez encore accès à votre email ?{' '}
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Réinitialisez votre mot de passe
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
