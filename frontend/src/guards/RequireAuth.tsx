import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';

/**
 * Guard qui vérifie que l'utilisateur est authentifié
 * Si non connecté, redirige vers /auth
 */
export function RequireAuth() {
  const { user, initialized } = useAuth();
  const [forceReady, setForceReady] = useState(false);

  // Timeout de sécurité : forcer le passage après 3 secondes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!initialized && !forceReady) {
        console.warn('[GUARD/AUTH] ⚠️ Forcing ready after timeout');
        setForceReady(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [initialized, forceReady]);

  // Attendre que l'initialisation soit terminée
  if (!initialized && !forceReady) {
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
    return <Navigate to="/auth" replace />;
  }

  // Utilisateur authentifié, afficher les routes enfants
  return <Outlet />;
}
