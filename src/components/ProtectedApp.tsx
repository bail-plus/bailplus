import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingGate } from '@/components/LoadingGate';
import { toast } from 'sonner';

interface ProtectedAppProps {
  children: React.ReactNode;
}

export function ProtectedApp({ children }: ProtectedAppProps) {
  const { user, session, loading } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    loading: boolean;
    hasActiveSubscription: boolean;
  }>({ loading: true, hasActiveSubscription: false });

  console.log('[GUARD] ProtectedApp check - user:', !!user, 'session:', !!session, 'loading:', loading);

  // Check subscription status when user/session changes
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !session) {
        console.log('[GUARD] No user/session - denying access');
        setSubscriptionStatus({ loading: false, hasActiveSubscription: false });
        return;
      }

      try {
        console.log('[GUARD] protected route check start');
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          console.error('[GUARD] protected route check fail:', error);
          
          // Check if user has subscription in local database as fallback
          console.log('[GUARD] Checking local subscription table as fallback...');
          const { data: localSubData, error: localError } = await supabase
            .from('subscriptions')
            .select('subscribed, subscription_status')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!localError && localSubData?.subscribed && localSubData?.subscription_status === 'active') {
            console.log('[GUARD] Local subscription found - granting access');
            setSubscriptionStatus({ loading: false, hasActiveSubscription: true });
            return;
          }
          
          console.log('[GUARD] No valid subscription found');
          setSubscriptionStatus({ loading: false, hasActiveSubscription: false });
          return;
        }

        const hasActiveSubscription = data?.subscribed === true;
        console.log('[GUARD] protected route check ok:', { hasActiveSubscription });
        
        setSubscriptionStatus({ 
          loading: false, 
          hasActiveSubscription 
        });
      } catch (error) {
        console.error('[GUARD] protected route check fail (catch):', error);
        setSubscriptionStatus({ loading: false, hasActiveSubscription: false });
      }
    };

    checkSubscription();
  }, [user, session]);

  // Show loading while checking auth or subscription
  if (loading || subscriptionStatus.loading) {
    return (
      <LoadingGate 
        isLoading={true} 
        message="Vérification de votre accès..."
      >
        <div />
      </LoadingGate>
    );
  }

  // Redirect to offers if not authenticated or no active subscription
  if (!user || !session || !subscriptionStatus.hasActiveSubscription) {
    console.log('[GUARD] Access denied - redirecting to offers', {
      hasUser: !!user,
      hasSession: !!session,
      hasActiveSubscription: subscriptionStatus.hasActiveSubscription,
      reason: !user ? 'no user' : !session ? 'no session' : 'no active subscription'
    });
    
    // Show a toast message to inform the user why they're being redirected
    if (user && session && !subscriptionStatus.hasActiveSubscription) {
      setTimeout(() => {
        toast.error('Abonnement requis - Souscrivez à une offre pour accéder à l\'application');
      }, 500);
    }
    
    return <Navigate to="/offers" replace />;
  }

  // User has active subscription - allow access to app
  console.log('[GUARD] Access granted - user has active subscription');
  return <>{children}</>;
}