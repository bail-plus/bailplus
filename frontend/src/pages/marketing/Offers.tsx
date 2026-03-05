import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useOffers } from '@/hooks/marketing/useOffers';



export default function Offers() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { data: offers = [], isLoading, error } = useOffers();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  return (

    <div className="min-h-screen bg-gradient-surface py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Abonnez-vous à BailloGenius
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez l’offre qui correspond à votre gestion locative
          </p>
        </div>


        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {offers.map((offer) => {
            const isPopular = !!offer.popular;
            return (
              <Card
                key={offer.id}
                className={[
                  'relative p-6 transition-all duration-200 hover:shadow-lg',
                  isPopular ? 'ring-2 ring-primary shadow-lg' : 'border',
                ].join(' ')}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Offre recommandée
                  </Badge>
                )}

                <CardHeader className="pb-6 text-center">
                  <CardTitle className="text-3xl">{offer.name}</CardTitle>
                  <CardDescription className="text-base">{offer.description}</CardDescription>
                  <div className="pt-4">
                    <div className="text-5xl font-bold text-foreground">
                      {offer.price}
                    </div>
                    <div className="text-muted-foreground text-lg">
                      {offer.period ?? '/mois'}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="text-center text-sm text-muted-foreground">
                    {offer.max_properties}
                  </div>

                  <ul className="space-y-3">
                    {(offer.features ?? []).map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full text-lg py-6"
                    //onClick={() => makePayment()}
                    //disabled={loadingId === offer.id as string}
                    size="lg"
                  >
                    {loadingId === String(offer.id) ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redirection vers Stripe...
                      </>
                    ) : (
                      <>
                        S&apos;abonner maintenant
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  {!isLoading && offers.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Aucune offre disponible. (Vérifie les droits RLS ou le contenu de la table.)
                    </div>
                  )}

                </CardContent>
              </Card>

            );
          })}
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
