import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') as 'LANDLORD' | 'SERVICE_PROVIDER' | null;
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');

  // Charger l'email de l'utilisateur
  useEffect(() => {
    const loadUserEmail = async () => {
      // 1. Essayer de récupérer l'email depuis l'URL
      const emailFromUrl = searchParams.get('email');
      if (emailFromUrl) {
        console.log('[VerifyEmail] Email trouvé dans l\'URL:', emailFromUrl);
        setUserEmail(decodeURIComponent(emailFromUrl));
        // Stocker dans sessionStorage pour persistance
        sessionStorage.setItem('pendingVerificationEmail', decodeURIComponent(emailFromUrl));
        return;
      }

      // 2. Essayer de récupérer l'email depuis sessionStorage
      const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        console.log('[VerifyEmail] Email trouvé dans sessionStorage:', storedEmail);
        setUserEmail(storedEmail);
        return;
      }

      // 3. Sinon, essayer de récupérer depuis Supabase
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('[VerifyEmail] User chargé:', currentUser);
      if (currentUser?.email) {
        console.log('[VerifyEmail] Email trouvé depuis Supabase:', currentUser.email);
        setUserEmail(currentUser.email);
        // Stocker pour les prochains rechargements
        sessionStorage.setItem('pendingVerificationEmail', currentUser.email);
      } else {
        console.error('[VerifyEmail] ❌ Aucun email trouvé');
      }
    };
    loadUserEmail();
  }, [searchParams]);

  // Vérifier toutes les 3 secondes si l'email a été vérifié
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();

      if (refreshedUser?.email_confirmed_at) {
        console.log('✅ Email vérifié, redirection...');
        // Nettoyer le sessionStorage
        sessionStorage.removeItem('pendingVerificationEmail');
        clearInterval(interval);
        if (userType) {
          navigate(`/complete-profile?type=${userType}`, { replace: true });
        } else {
          navigate('/complete-profile', { replace: true });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate, userType]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    console.log('[VerifyEmail] Tentative de renvoi d\'email...');
    console.log('[VerifyEmail] User:', user);
    console.log('[VerifyEmail] UserEmail state:', userEmail);

    // Utiliser userEmail (du state) plutôt que user?.email
    const emailToUse = userEmail || user?.email;

    if (!emailToUse) {
      console.error('[VerifyEmail] ❌ Pas d\'email disponible');
      toast.error('Adresse email introuvable. Veuillez vous reconnecter.');
      return;
    }

    setIsResending(true);
    try {
      console.log('[VerifyEmail] Appel de supabase.auth.resend avec email:', emailToUse);
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
      });

      console.log('[VerifyEmail] Résultat:', { data, error });

      if (error) {
        console.error('[VerifyEmail] ❌ Erreur de Supabase:', error);
        throw error;
      }

      console.log('[VerifyEmail] ✅ Email renvoyé avec succès');
      toast.success('Email de vérification renvoyé ! Vérifiez votre boîte mail.');
      setCooldown(60); // 60 secondes de cooldown
    } catch (error: any) {
      console.error('[VerifyEmail] ❌ Exception lors du renvoi:', error);

      // Messages d'erreur plus explicites en français
      if (error.message?.includes('Email rate limit exceeded')) {
        toast.error('Trop de demandes. Veuillez attendre quelques minutes avant de réessayer.');
      } else if (error.message?.includes('For security purposes')) {
        toast.error('Pour des raisons de sécurité, veuillez attendre 60 secondes avant de renvoyer un email.');
        setCooldown(60); // Activer le cooldown de 60 secondes
      } else if (error.message?.includes('User not found')) {
        toast.error('Utilisateur introuvable. Veuillez vous reconnecter.');
      } else {
        toast.error(error.message || 'Erreur lors du renvoi de l\'email. Veuillez réessayer plus tard.');
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-500" />
            </div>
            <CardTitle>Vérifiez votre adresse email</CardTitle>
            <CardDescription>
              Nous avons envoyé un email de vérification à <strong>{userEmail || user?.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Étapes à suivre :</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Ouvrez votre boîte mail</li>
                    <li>Cliquez sur le lien de vérification</li>
                    <li>Vous serez automatiquement redirigé</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Vous n'avez pas reçu l'email ?
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendEmail}
                disabled={isResending || cooldown > 0}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : cooldown > 0 ? (
                  `Renvoyer dans ${cooldown}s`
                ) : (
                  'Renvoyer l\'email'
                )}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Vérifiez aussi vos spams ou courriers indésirables
              </p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  sessionStorage.removeItem('pendingVerificationEmail');
                  supabase.auth.signOut();
                  navigate('/auth');
                }}
              >
                Utiliser une autre adresse email
              </Button>

              {!userEmail && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    sessionStorage.removeItem('pendingVerificationEmail');
                    navigate('/auth');
                  }}
                >
                  Retour à la connexion
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
