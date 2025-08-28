import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const starterOffer = {
  id: 'starter',
  name: 'Starter',
  price: '29€',
  description: 'Parfait pour débuter avec BailloGenius',
  features: [
    'Jusqu\'à 5 propriétés',
    'Gestion des locataires',
    'Suivi des paiements',
    'Support email',
    'Tableaux de bord',
    'Rapports de base'
  ],
  maxProperties: '5 propriétés',
  popular: true
};

export default function Offers() {
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const navigate = useNavigate();

  // Simple handlers with direct redirections to avoid navigation interference
  const handleSignup = () => {
    console.log('🔴 SIGNUP BUTTON CLICKED - DIRECT REDIRECT');
    setIsSignupLoading(true);
    
    // Use direct redirect instead of navigate to avoid interference
    setTimeout(() => {
      console.log('🔴 DIRECT REDIRECT to signup');
      window.location.href = '/signup?redirect=stripe';
    }, 100);
  };

  const handleLogin = () => {
    console.log('🔵 LOGIN BUTTON CLICKED - DIRECT REDIRECT');
    setIsLoginLoading(true);
    
    // Use direct redirect instead of navigate to avoid interference  
    setTimeout(() => {
      console.log('🔵 DIRECT REDIRECT to login');
      window.location.href = '/login';
    }, 100);
  };

  // Test if component is even rendering
  console.log('🟡 Offers component rendering');

  return (
    <div className="min-h-screen bg-gradient-surface py-12">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Abonnez-vous à BailloGenius
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Commencez dès aujourd'hui avec notre offre Starter
          </p>
        </div>

          <div className="flex justify-center max-w-md mx-auto">
            <Card className="relative p-6 transition-all duration-200 hover:shadow-lg ring-2 ring-primary shadow-lg">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Offre recommandée
              </Badge>
              
              <CardHeader className="pb-6 text-center">
                <CardTitle className="text-3xl">{starterOffer.name}</CardTitle>
                <CardDescription className="text-base">{starterOffer.description}</CardDescription>
                <div className="pt-4">
                  <div className="text-5xl font-bold text-foreground">
                    {starterOffer.price}
                  </div>
                  <div className="text-muted-foreground text-lg">/mois</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="text-center text-sm text-muted-foreground">
                  {starterOffer.maxProperties}
                </div>

                <ul className="space-y-3">
                  {starterOffer.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <Button 
                    className="w-full text-lg py-6" 
                    onClick={handleSignup}
                    disabled={isSignupLoading}
                    size="lg"
                  >
                    {isSignupLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redirection...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-5 w-5" />
                        S'inscrire et s'abonner
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full text-lg py-6" 
                    onClick={handleLogin}
                    disabled={isLoginLoading}
                    size="lg"
                  >
                    {isLoginLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redirection...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  <p className="mb-2">
                    <strong>Nouveaux utilisateurs :</strong> Créez votre compte et souscrivez à l'abonnement
                  </p>
                  <p>
                    <strong>Déjà abonné :</strong> Connectez-vous directement à votre compte
                  </p>
                </div>
              </CardContent>
            </Card>
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