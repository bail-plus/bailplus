import { useMemo, memo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * Guard qui vérifie que le profil utilisateur est complet
 * Si incomplet, redirige vers /complete-profile
 */
export const RequireCompleteProfile = memo(function RequireCompleteProfile() {
  const { profile, initialized } = useAuth();
  const location = useLocation();

  // Attendre que l'initialisation soit terminée
  // On utilise initialized au lieu de isReady pour éviter les re-renders lors des refetch
  if (!initialized || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // Vérifier si le profil est complet - mémorisé pour éviter les re-calculations
  const isProfileComplete = useMemo(() => {
    return !!(profile &&
      profile.phone_number &&
      profile.adress &&
      profile.city &&
      profile.postal_code !== null &&
      profile.gender &&
      profile.birthdate);
  }, [profile?.phone_number, profile?.adress, profile?.city, profile?.postal_code, profile?.gender, profile?.birthdate]);

  // Si profil incomplet et pas déjà sur la page complete-profile, rediriger
  if (!isProfileComplete && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Profil complet, afficher les routes enfants
  return <Outlet />;
});
