import { useState } from 'react';
import { Link } from 'react-router-dom';
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
    popular: false
  },
  {
    id: 'pro',
    name: siteConfig.pricing.pro.name,
    price: siteConfig.pricing.pro.price.monthly,
    description: siteConfig.pricing.pro.description,
    features: siteConfig.pricing.pro.features,
    maxProperties: siteConfig.pricing.pro.maxProperties,
    popular: siteConfig.pricing.pro.popular
  },
  {
    id: 'enterprise',
    name: siteConfig.pricing.enterprise.name,
    price: siteConfig.pricing.enterprise.price.monthly,
    description: siteConfig.pricing.enterprise.description,
    features: siteConfig.pricing.enterprise.features,
    maxProperties: siteConfig.pricing.enterprise.maxProperties,
    popular: false
  }
];

export default function Offers() {
  const { user, session, loading } = useAuth();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!user || !session) {
      toast.error('Vous devez être connecté pour souscrire à une offre');
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
        console.error('❌ Function error:', error);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Accès restreint</CardTitle>
            <CardDescription>
              Vous devez être connecté pour accéder à cette page.
              <br />
              <small className="text-xs mt-2 block">
                Si vous venez de vous inscrire, vérifiez vos emails pour confirmer votre compte.
              </small>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/login">Se connecter</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/signup">Créer un compte</Link>
            </Button>
            <div className="text-center text-sm text-muted-foreground mt-4">
              <p>Debug: User={user ? 'Connected' : 'Not connected'}, Session={session ? 'Active' : 'None'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add debug info to console
  console.log('🔍 Offers page - User authenticated:', { 
    userId: user.id, 
    email: user.email, 
    emailConfirmed: user.email_confirmed_at,
    sessionActive: !!session 
  });

  return (
    <div className="min-h-screen bg-gradient-surface py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choisissez votre offre
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez l'offre qui correspond le mieux à vos besoins pour commencer à utiliser BailloGenius
          </p>
          
          {/* Test button for debugging */}
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={async () => {
                console.log('🧪 Testing edge function connectivity...');
                try {
                  const { data, error } = await supabase.functions.invoke('test-connection');
                  console.log('🧪 Test result:', { data, error });
                  if (data) {
                    toast.success(`Test réussi ! Stripe: ${data.stripe_key_configured ? '✅' : '❌'}`);
                  }
                } catch (err) {
                  console.error('🧪 Test failed:', err);
                  toast.error('Test de connexion échoué');
                }
              }}
            >
              🧪 Test Connexion
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                      Redirection...
                    </>
                  ) : (
                    <>
                      Choisir cette offre
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