import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Wrench, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SelectUserType() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOAuth = searchParams.get('oauth') === 'true';

  const handleSelectType = (type: 'LANDLORD' | 'SERVICE_PROVIDER' | 'TENANT') => {
    if (isOAuth) {
      // Après Google OAuth, on va vers complete-profile avec le type
      navigate(`/complete-profile?type=${type}`);
    } else {
      // Inscription classique, on va vers le formulaire d'inscription
      navigate(`/signup?type=${type}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            {isOAuth ? 'Choisissez votre profil' : 'Comment souhaitez-vous utiliser BailoGenius ?'}
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Sélectionnez le type de compte qui correspond à votre situation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Propriétaire */}
          <Card className="cursor-pointer hover:border-primary hover:shadow-lg transition-all">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Propriétaire</CardTitle>
              <CardDescription>
                Je possède des biens immobiliers et je souhaite les gérer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleSelectType('LANDLORD')}
              >
                Je suis propriétaire
              </Button>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Gérer mes biens et locataires</li>
                <li>• Générer des quittances</li>
                <li>• Suivre les loyers</li>
              </ul>
            </CardContent>
          </Card>

          {/* Prestataire */}
          <Card className="cursor-pointer hover:border-primary hover:shadow-lg transition-all">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                <Wrench className="w-8 h-8 text-orange-500" />
              </div>
              <CardTitle>Prestataire</CardTitle>
              <CardDescription>
                Je suis artisan ou prestataire de services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleSelectType('SERVICE_PROVIDER')}
              >
                Je suis prestataire
              </Button>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Recevoir des demandes</li>
                <li>• Gérer mes interventions</li>
                <li>• Suivre mes missions</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Info locataires */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Vous êtes locataire ?</h3>
                  <p className="text-sm text-muted-foreground">
                    Les comptes locataires sont créés par invitation uniquement. Votre propriétaire doit vous inviter à rejoindre la plateforme depuis son espace.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {!isOAuth && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{' '}
              <Button variant="link" className="p-0" onClick={() => navigate('/auth')}>
                Se connecter
              </Button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
