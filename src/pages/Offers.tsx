import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { siteConfig } from '@/config/site';

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
  
  const processStoredOffer = async (offerId: string) => {
    console.log('🔍 Processing stored offer:', { offerId, userId: user?.id, sessionExists: !!session });
    setSelectedOffer(offerId);
    setIsLoading(true);

    try {
      console.log('📤 Calling create-checkout function with:', { tier: offerId });
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: offerId },
        headers: {
          Authorization: `Bearer ${session!.access_token}`,
        },
      });

      console.log('📥 Function response:', { data, error });

      if (error) {
        console.error('❌ Function error details:', {
          name: error.name,
          message: error.message,
          context: error.context,
          stack: error.stack
        });
        throw error;
      }

      if (data?.url) {
        console.log('✅ Redirecting to Stripe:', data.url);
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        console.error('❌ No URL in response:', data);
        throw new Error('Aucune URL de paiement reçue');
      }
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      toast.error('Erreur lors de la création de la session de paiement');
    } finally {
      setIsLoading(false);
      setSelectedOffer(null);
    }
  };

  // Check if user just came back from auth and has a stored offer
  useEffect(() => {
    const storedOffer = sessionStorage.getItem('selectedOffer');
    if (user && session && storedOffer) {
      console.log('🔄 User returned from auth, processing stored offer:', storedOffer);
      sessionStorage.removeItem('selectedOffer');
      // Auto-trigger the offer selection after a short delay
      setTimeout(() => {
        processStoredOffer(storedOffer);
      }, 1000);
    }
  }, [user, session]);

  // Handle checkout status messages
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    if (checkoutStatus === 'success') {
      toast.success('Paiement réussi ! Votre abonnement est maintenant actif.');
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
      // Remove the checkout parameter from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('checkout');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleSelectOffer = async (offerId: string) => {
    // If user is not authenticated, redirect to signup with offer info
    if (!user || !session) {
      console.log('🔄 User not authenticated, redirecting to signup with offer:', offerId);
      // Store the selected offer in sessionStorage for after auth
      sessionStorage.setItem('selectedOffer', offerId);
      window.location.href = `/signup?offer=${offerId}`;
      return;
    }

    console.log('🔍 Starting offer selection:', { offerId, userId: user.id, sessionExists: !!session });
    setSelectedOffer(offerId);
    setIsLoading(true);

    try {
      console.log('📤 Calling create-checkout function with:', { tier: offerId });
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: offerId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('📥 Function response:', { data, error });

      if (error) {
        console.error('❌ Function error details:', {
          name: error.name,
          message: error.message,
          context: error.context,
          stack: error.stack
        });
        
        // Try to get more details from the error
        if (error.context?.body) {
          console.error('❌ Error response body:', error.context.body);
        }
        
        throw error;
      }

      if (data?.url) {
        console.log('✅ Redirecting to Stripe:', data.url);
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        console.error('❌ No URL in response:', data);
        throw new Error('Aucune URL de paiement reçue');
      }
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      toast.error('Erreur lors de la création de la session de paiement');
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
      sessionActive: !!session 
    });
  }

  return (
    <div className="min-h-screen bg-gradient-surface py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choisissez votre abonnement
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez l'offre Starter pour commencer à utiliser BailloGenius et simplifier votre gestion locative
          </p>
          
          {/* Remove debug buttons from production */}
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
                  disabled={isLoading}
                  variant={offer.popular ? "default" : "outline"}
                >
                  {isLoading && selectedOffer === offer.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {user ? 'Redirection...' : 'Redirection vers inscription...'}
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
  );
}