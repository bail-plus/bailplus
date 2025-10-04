import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Guard qui vérifie que l'utilisateur est authentifié
 * Si non connecté, redirige vers /auth
 */
export function RequireAuth() {
  const { user, loading, initialized } = useAuth();

  console.log('[GUARD/AUTH]', { user: !!user, loading, initialized });

  // Attendre que l'initialisation soit terminée
  if (!initialized || loading) {
    console.log('[GUARD/AUTH] Waiting for initialization...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, rediriger vers /auth
  if (!user) {
    console.log('[GUARD/AUTH] ❌ No user - Redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('[GUARD/AUTH] ✅ User authenticated');
  // Utilisateur authentifié, afficher les routes enfants
  return <Outlet />;
}
