// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

// accepte 'YYYY-MM-DD' ou ISO
function parseDateLocalMs(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const [, Y, M, D] = m;
    return startOfDay(new Date(Number(Y), Number(M) - 1, Number(D)));
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return startOfDay(d);
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  const trialExpired = useMemo(() => {
    const endMs = parseDateLocalMs(profile?.trial_end_date ?? null);
    const todayMs = startOfDay(new Date());
    return endMs !== null && endMs < todayMs;
  }, [profile?.trial_end_date]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // pas connecté → login, en mémorisant la destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est encore en TRIAL mais que l'essai est expiré → offres/paywall
  if ((profile?.role === 'trial' || !profile?.role) && trialExpired) {
    return <Navigate to="/offers" replace />;
    // ou: return <Navigate to="/app/paywall" replace />;
  }

  // Sinon OK
  return <>{children}</>;
}
