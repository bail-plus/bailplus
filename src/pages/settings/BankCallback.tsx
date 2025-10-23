import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BankCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // 1. Récupérer les paramètres de l'URL
      const itemId = searchParams.get('item_id');

      if (!itemId) {
        throw new Error('Aucune connexion bancaire reçue');
      }

      // 2. Vérifier l'authentification
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // 3. Récupérer les détails de l'item via Edge Function
      const { data: itemData, error: itemError } = await supabase.functions.invoke(
        'bridge-get-item',
        {
          body: { item_id: itemId },
        }
      );

      if (itemError) throw itemError;

      const { item, accounts } = itemData;

      if (!item || item.status !== 'ok') {
        throw new Error('Erreur lors de la connexion à la banque');
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('Aucun compte trouvé');
      }

      // 4. Prendre le premier compte (TODO: permettre de choisir)
      const account = accounts[0];

      // 5. Sauvegarder dans bank_connections
      const { error: insertError } = await supabase
        .from('bank_connections')
        .insert({
          user_id: user.id,
          institution_id: item.bank_id?.toString() || item.id.toString(),
          institution_name: item.bank?.name || 'Banque',
          requisition_id: item.id.toString(),
          account_id: account.id.toString(),
          consent_expires_at: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000
          ).toISOString(), // 90 jours
          iban: account.iban ? `****${account.iban.slice(-4)}` : null,
          account_name: account.name,
          currency: account.currency_code || 'EUR',
          consent_status: 'active',
        });

      if (insertError) throw insertError;

      // 6. Succès !
      setStatus('success');

      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/app/settings?tab=banking');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors du callback:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la connexion'
      );

      // Rediriger après 5 secondes
      setTimeout(() => {
        navigate('/app/settings?tab=banking');
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">
                  Finalisation de la connexion...
                </h1>
                <p className="text-muted-foreground">
                  Veuillez patienter pendant que nous sécurisons votre
                  connexion bancaire
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-green-600">
                  Connexion réussie !
                </h1>
                <p className="text-muted-foreground mb-4">
                  Votre compte bancaire a été connecté avec succès.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirection vers les paramètres...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-red-600">
                  Erreur de connexion
                </h1>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>
                <Button onClick={() => navigate('/app/settings?tab=banking')}>
                  Retour aux paramètres
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
