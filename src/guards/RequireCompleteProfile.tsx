import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * Guard qui vérifie que le profil utilisateur est complet
 * Si incomplet, redirige vers /complete-profile
 */
export function RequireCompleteProfile() {
  const { profile, isReady } = useAuth();
  const location = useLocation();

  // Attendre que l'initialisation soit terminée ET que le profil soit chargé
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // Vérifier si le profil est complet
  const isProfileComplete = profile &&
    profile.phone_number &&
    profile.adress &&
    profile.city &&
    profile.postal_code !== null &&
    profile.gender &&
    profile.birthdate;

  // Si profil incomplet et pas déjà sur la page complete-profile, rediriger
  if (!isProfileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Profil complet, afficher les routes enfants
  return <Outlet />;
}
