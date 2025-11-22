import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * Guard qui vérifie que l'email de l'utilisateur est vérifié
 * Si non vérifié, redirige vers /verify-email
 */
export function RequireEmailVerified() {
  const { user, isReady } = useAuth();
  const location = useLocation();

  // Attendre que l'initialisation soit terminée
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'email est vérifié
  const isEmailVerified = user?.email_confirmed_at !== null;


  // Si email non vérifié et pas déjà sur la page verify-email, rediriger
  if (!isEmailVerified && location.pathname !== '/verify-email') {
    // Préserver les paramètres de type si présents
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type');
    return <Navigate to={`/verify-email${type ? `?type=${type}` : ''}`} replace />;
  }

  // Email vérifié, afficher les routes enfants
  return <Outlet />;
}
