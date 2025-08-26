// Stripe checkout utility functions

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setCheckoutPending, clearCheckoutPending, isCheckoutPending } from './subscription-intent';

interface CheckoutOptions {
  priceId: string;
  tier: 'starter' | 'pro' | 'enterprise';
  session: any; // Supabase session
}

export async function createCheckoutSession({ priceId, tier, session }: CheckoutOptions): Promise<string | null> {
  if (isCheckoutPending()) {
    console.log('⚠️ Checkout already pending, ignoring request');
    toast.error('Une session de paiement est déjà en cours...');
    return null;
  }

  setCheckoutPending();
  console.log('🚀 Creating checkout session:', { priceId, tier });

  try {
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { 
        priceId,
        tier 
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    console.log('📥 Checkout response:', { data, error });

    if (error) {
      console.error('❌ Checkout creation error:', error);
      toast.error('Impossible de démarrer le paiement. Réessayez.');
      return null;
    }

    if (!data?.url) {
      console.error('❌ No checkout URL received:', data);
      toast.error('Erreur lors de la création de la session de paiement');
      return null;
    }

    console.log('✅ Checkout session created:', data.url);
    return data.url;

  } catch (error) {
    console.error('❌ Unexpected error during checkout:', error);
    toast.error('Erreur inattendue lors du paiement');
    return null;
  } finally {
    clearCheckoutPending();
  }
}

export function redirectToCheckout(url: string) {
  console.log('🔄 Redirecting to Stripe Checkout:', url);
  window.open(url, '_blank');
}

// Main function to handle offer selection
export async function handleOfferSelection(
  offerId: 'starter' | 'pro' | 'enterprise', 
  user: any, 
  session: any
): Promise<boolean> {
  if (!user || !session) {
    return false; // Caller should handle auth redirect
  }

  // Map tier to price ID (this should match your Supabase secrets)
  const priceIdMap = {
    starter: 'STRIPE_PRICE_STARTER',
    pro: 'STRIPE_PRICE_PRO', 
    enterprise: 'STRIPE_PRICE_ENTERPRISE'
  };

  const priceId = priceIdMap[offerId];
  if (!priceId) {
    toast.error('Offre non reconnue');
    return false;
  }

  const checkoutUrl = await createCheckoutSession({ 
    priceId, 
    tier: offerId, 
    session 
  });

  if (checkoutUrl) {
    redirectToCheckout(checkoutUrl);
    return true;
  }

  return false;
}