import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Page de gestion de la redirection après confirmation d'email
 * Supabase redirige vers cette page après que l'utilisateur clique sur le lien de vérification
 */
export default function EmailConfirmHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      console.log('[EmailConfirmHandler] Traitement de la confirmation d\'email...');

      // Récupérer les paramètres de l'URL (token, type, etc.)
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const userTypeFromUrl = searchParams.get('user_type'); // Type d'utilisateur (LANDLORD, SERVICE_PROVIDER)

      // Récupérer le type depuis sessionStorage si pas dans l'URL
      const userTypeFromStorage = sessionStorage.getItem('pendingUserType');
      const userType = userTypeFromUrl || userTypeFromStorage;

      console.log('[EmailConfirmHandler] Params:', {
        token_hash,
        type,
        userTypeFromUrl,
        userTypeFromStorage,
        userType
      });

      // Si c'est une confirmation d'email
      if (type === 'signup' || type === 'email_confirmation') {
        try {
          // Vérifier que l'utilisateur est bien connecté et que l'email est confirmé
          const { data: { user } } = await supabase.auth.getUser();

          if (user?.email_confirmed_at) {
            console.log('[EmailConfirmHandler] ✅ Email confirmé avec succès !');

            // Récupérer le type d'utilisateur depuis la base de données
            let finalUserType = userType;

            if (!finalUserType && user?.id) {
              console.log('[EmailConfirmHandler] Récupération du user_type depuis la base...');
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('user_type')
                .eq('user_id', user.id)
                .single();

              if (profileError) {
                console.error('[EmailConfirmHandler] Erreur récupération profil:', profileError);
              } else if (profile?.user_type) {
                finalUserType = profile.user_type;
                console.log('[EmailConfirmHandler] user_type trouvé dans profiles:', finalUserType);
              }
            }

            console.log('[EmailConfirmHandler] Type d\'utilisateur final:', finalUserType);
            toast.success('Email vérifié avec succès !');

            // Nettoyer le sessionStorage
            sessionStorage.removeItem('pendingVerificationEmail');
            sessionStorage.removeItem('pendingUserType');

            // Rediriger vers complete-profile avec le type d'utilisateur si disponible
            if (finalUserType) {
              console.log('[EmailConfirmHandler] Redirection vers /complete-profile?type=' + finalUserType);
              navigate(`/complete-profile?type=${finalUserType}`, { replace: true });
            } else {
              console.warn('[EmailConfirmHandler] ⚠️ Aucun type d\'utilisateur trouvé, redirection sans type');
              navigate('/complete-profile', { replace: true });
            }
          } else {
            console.error('[EmailConfirmHandler] ❌ Email non confirmé');
            toast.error('Erreur lors de la vérification de l\'email');
            navigate('/auth', { replace: true });
          }
        } catch (error) {
          console.error('[EmailConfirmHandler] ❌ Erreur:', error);
          toast.error('Erreur lors de la vérification de l\'email');
          navigate('/auth', { replace: true });
        }
      } else {
        // Autre type de confirmation (reset password, etc.)
        console.log('[EmailConfirmHandler] Type de confirmation non géré:', type);
        navigate('/auth', { replace: true });
      }
    };

    handleEmailConfirmation();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium text-foreground">Vérification de votre email...</p>
        <p className="text-sm text-muted-foreground mt-2">Veuillez patienter</p>
      </div>
    </div>
  );
}
