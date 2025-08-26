import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { siteConfig } from '@/config/site';
import { 
  storeSubscriptionIntent, 
  getSubscriptionIntent, 
  clearSubscriptionIntent,
  getIntentFromParams 
} from '@/lib/subscription-intent';
import { handleOfferSelection } from '@/lib/stripe-checkout';
import { LoadingGate } from '@/components/LoadingGate';
import { supabase } from '@/integrations/supabase/client';

const offers = [
  {
    id: 'starter',
    name: siteConfig.pricing.starter.name,
    price: siteConfig.pricing.starter.price.monthly,
    description: siteConfig.pricing.starter.description,
    features: siteConfig.pricing.starter.features,
    maxProperties: siteConfig.pricing.starter.maxProperties,
    popular: true
  }
];

export default function Offers() {
  const { user, session, loading } = useAuth();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isProcessingIntent, setIsProcessingIntent] = useState(false);

  // Process stored subscription intent when user becomes authenticated
  const processSubscriptionIntent = async () => {
    if (!user || !session) return;
    
    // Try URL params first, then localStorage
    const urlIntent = getIntentFromParams(searchParams);
    const storedIntent = urlIntent || getSubscriptionIntent();
    
    if (!storedIntent) return;

    console.log('🔄 Processing subscription intent:', storedIntent);
    setIsProcessingIntent(true);

    try {
      const success = await handleOfferSelection(storedIntent.tier, user, session);
      if (success) {
        console.log('✅ Subscription intent processed successfully');
        clearSubscriptionIntent();
        
        // Clean URL params if they were used
        if (urlIntent) {
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('intent');
          newParams.delete('priceId');
          newParams.delete('tier');
          setSearchParams(newParams, { replace: true });
        }
      }
    } catch (error) {
      console.error('❌ Error processing subscription intent:', error);
      toast.error('Erreur lors du traitement de votre demande d\'abonnement');
    } finally {
      setIsProcessingIntent(false);
    }
  };

  // Debug function to replay stored intent
  const debugReplayIntent = async () => {
    console.log('🔧 Debug: Replaying subscription intent...');
    await processSubscriptionIntent();
  };

  // Debug function to test Stripe connection
  const debugStripeConnection = async () => {
    try {
      console.log('🔧 Testing Stripe connection...');
      
      // Test with test-connection function first (simpler)
      const { data: testData, error: testError } = await supabase.functions.invoke('test-connection');
      console.log('🔧 Test connection response:', { testData, testError });
      
      // Then test with debug-stripe function
      const { data, error } = await supabase.functions.invoke('debug-stripe', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      
      console.log('🔧 Debug Stripe response:', { data, error });
      
      if (testError) {
        toast.error(`Test connection error: ${testError.message}`);
      } else if (error) {
        toast.error(`Debug error: ${error.message}`);
      } else if (data?.success) {
        toast.success('✅ Stripe configuration is valid!');
      } else {
        toast.error(`Debug failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Debug connection error:', error);
      toast.error('Erreur lors du test de connexion Stripe');
    }
  };

  // Check for subscription intent when user auth state changes
  useEffect(() => {
    if (user && session && !isProcessingIntent) {
      const urlIntent = getIntentFromParams(searchParams);
      const storedIntent = getSubscriptionIntent();
      
      if (urlIntent || storedIntent) {
        console.log('👤 User authenticated with pending subscription intent');
        // Small delay to ensure auth is fully settled
        setTimeout(() => {
          processSubscriptionIntent();
        }, 500);
      }
    }
  }, [user, session]);

  // Handle checkout status messages
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast.success('Paiement réussi ! Votre abonnement est maintenant actif.');
      // Clear any pending intents
      clearSubscriptionIntent();
      // Remove the checkout parameter from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('checkout');
      newParams.delete('session_id');
      setSearchParams(newParams, { replace: true });
      
      // Redirect to app after a short delay to show the success message
      setTimeout(() => {
        window.location.href = '/app';
      }, 2000);
    } else if (checkoutStatus === 'cancel') {
      toast.error('Paiement annulé. Vous pouvez reprendre le processus à tout moment.');
      // Clear any pending intents
      clearSubscriptionIntent();
      // Remove the checkout parameter from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('checkout');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSelectOffer = async (offerId: string) => {
    // Only starter tier is available for now
    if (offerId !== 'starter') {
      toast.error('Seule l\'offre Starter est disponible pour le moment');
      return;
    }

    const tier = 'starter' as const;

    // If user is not authenticated, store intent and redirect to signup
    if (!user || !session) {
      console.log('🔄 User not authenticated, storing intent and redirecting to signup');
      
      const priceId = 'STRIPE_PRICE_STARTER';
      storeSubscriptionIntent(priceId, tier);
      
      // Redirect with URL params as backup
      const params = new URLSearchParams({
        intent: 'subscribe',
        priceId: priceId,
        tier: tier,
        next: 'offers'
      });
      
      window.location.href = `/signup?${params.toString()}`;
      return;
    }

    // User is authenticated, proceed with checkout
    console.log('🔍 Starting offer selection for authenticated user:', { offerId, tier });
    setSelectedOffer(offerId);
    setIsLoading(true);

    try {
      const success = await handleOfferSelection(tier, user, session);
      if (success) {
        console.log('✅ Offer selection completed successfully');
      }
    } finally {
      setIsLoading(false);
      setSelectedOffer(null);
    }
  };

  // Add debug info to console if authenticated
  if (user) {
    console.log('🔍 Offers page - User authenticated:', { 
      userId: user.id, 
      email: user.email, 
      emailConfirmed: user.email_confirmed_at,
      sessionActive: !!session,
      hasStoredIntent: !!getSubscriptionIntent()
    });
  }

  return (
    <LoadingGate 
      isLoading={loading || isProcessingIntent} 
      message={isProcessingIntent ? "Traitement de votre demande d'abonnement..." : "Chargement..."}
    >
      <div className="min-h-screen bg-gradient-surface py-12">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Choisissez votre abonnement
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sélectionnez l'offre Starter pour commencer à utiliser BailloGenius et simplifier votre gestion locative
            </p>
            
            {/* Debug buttons for testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={debugStripeConnection}
                  className="text-xs"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  🔧 Tester la connexion Stripe
                </Button>
                {getSubscriptionIntent() && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={debugReplayIntent}
                    className="text-xs"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    🔧 Rejouer l'intention d'abonnement
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-center max-w-lg mx-auto">
            {offers.map((offer) => (
              <Card 
                key={offer.id} 
                className={`relative p-6 transition-all duration-200 hover:shadow-lg ${
                  offer.popular ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
              >
                {offer.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Le plus populaire
                  </Badge>
                )}
                
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl">{offer.name}</CardTitle>
                  <CardDescription className="text-base">{offer.description}</CardDescription>
                  <div className="pt-4">
                    <div className="text-4xl font-bold text-foreground">
                      {typeof offer.price === 'number' ? `${offer.price}€` : offer.price}
                    </div>
                    {typeof offer.price === 'number' && (
                      <div className="text-muted-foreground">/mois</div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    {typeof offer.maxProperties === 'number' 
                      ? `Jusqu'à ${offer.maxProperties} lots`
                      : offer.maxProperties
                    }
                  </div>

                  <ul className="space-y-3">
                    {offer.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectOffer(offer.id)}
                    disabled={isLoading || isProcessingIntent}
                    variant={offer.popular ? "default" : "outline"}
                  >
                    {isLoading && selectedOffer === offer.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirection vers Stripe...
                      </>
                    ) : isProcessingIntent ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        {user ? 'Choisir cette offre' : 'S\'abonner'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-4">
              Paiement sécurisé par Stripe • Annulation possible à tout moment
            </p>
            <p className="text-sm text-muted-foreground">
              Questions ? Contactez-nous à{' '}
              <a href="mailto:contact@bailogenius.fr" className="text-primary hover:underline">
                contact@bailogenius.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </LoadingGate>
  );
}