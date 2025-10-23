import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, AlertCircle } from 'lucide-react';
import { BridgeClient } from '@/services/bridge';
import {
  BankConnectionCard,
  BankConnection,
} from './BankConnectionCard';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

type BankingTabProps = {
  accounts?: any[];
  formatDate?: (value: string) => string;
};

export function BankingTab({ accounts, formatDate }: BankingTabProps) {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();
  const client = new BridgeClient();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('user_id', user.id)
        .neq('consent_status', 'revoked')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformer les données pour le composant
      const transformedConnections: BankConnection[] =
        data?.map((conn) => ({
          id: conn.id,
          bank_name: conn.institution_name,
          bank_logo: undefined, // TODO: récupérer depuis Bridge API
          iban: conn.iban || '****',
          account_name: conn.account_name || undefined,
          status:
            conn.consent_status === 'expired'
              ? 'expired'
              : conn.last_sync_status === 'error'
              ? 'error'
              : 'active',
          last_sync_at: conn.last_sync_at,
          created_at: conn.created_at,
        })) || [];

      setConnections(transformedConnections);
    } catch (error) {
      console.error('Erreur lors du chargement des connexions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les connexions bancaires',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBank = async () => {
    if (connecting) return;

    setConnecting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Créer une Connect session via Edge Function
      const { data, error } = await supabase.functions.invoke(
        'bridge-create-connect-session',
        {
          body: {
            redirect_url: `${window.location.origin}/settings/bank-callback`,
            prefill_email: user.email,
          },
        }
      );

      if (error) throw error;

      // Rediriger vers Bridge Connect
      // Bridge gérera la sélection de la banque et l'authentification
      window.location.href = data.redirect_url;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de se connecter à la banque',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    const confirm = window.confirm(
      'Voulez-vous vraiment déconnecter ce compte bancaire ? Les vérifications automatiques seront désactivées.'
    );

    if (!confirm) return;

    try {
      const { error } = await supabase
        .from('bank_connections')
        .update({ consent_status: 'revoked' })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: 'Déconnexion réussie',
        description: 'Le compte bancaire a été déconnecté',
      });

      // Recharger les connexions
      await loadConnections();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de déconnecter le compte',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">
            Chargement des connexions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Connexions bancaires</h3>
          <p className="text-sm text-muted-foreground">
            Connectez votre banque pour vérifier automatiquement les paiements
            de loyer
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Connecter une banque
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Connecter un compte bancaire</DialogTitle>
              <DialogDescription>
                Vous allez être redirigé vers Bridge pour sélectionner votre
                banque et vous authentifier en toute sécurité.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                <p className="font-semibold mb-2">🔒 Connexion sécurisée</p>
                <ul className="space-y-1 ml-4 list-disc text-xs">
                  <li>Bridge est certifié PSD2 et agréé par l'ACPR</li>
                  <li>Vos identifiants bancaires ne transitent jamais par notre serveur</li>
                  <li>Connexion chiffrée de bout en bout</li>
                  <li>Vous pouvez révoquer l'accès à tout moment</li>
                </ul>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-semibold mb-1">Comment ça marche ?</p>
                <ol className="space-y-1 ml-4 list-decimal text-xs">
                  <li>Sélectionnez votre banque sur la page Bridge</li>
                  <li>Connectez-vous avec vos identifiants bancaires habituels</li>
                  <li>Autorisez l'accès en lecture à vos transactions</li>
                  <li>C'est fait ! Les paiements de loyer seront vérifiés automatiquement</li>
                </ol>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={connecting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleConnectBank}
                disabled={connecting}
              >
                {connecting ? 'Redirection...' : 'Continuer vers Bridge'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!client.isConfigured() && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bridge API n'est pas configuré. Ajoutez VITE_BRIDGE_CLIENT_ID et
            VITE_BRIDGE_CLIENT_SECRET dans votre fichier .env.local
          </AlertDescription>
        </Alert>
      )}

      {connections.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Aucune banque connectée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Connectez votre compte bancaire pour automatiser la
                vérification des paiements de loyer le 5 et le 10 de chaque
                mois.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Connecter ma première banque
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((connection) => (
            <BankConnectionCard
              key={connection.id}
              connection={connection}
              onRefresh={() => {}}
              onDisconnect={handleDisconnect}
              refreshing={false}
            />
          ))}
        </div>
      )}

      <Card>
        <CardContent className="py-6">
          <h4 className="font-semibold mb-2">
            📅 Vérifications automatiques
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Les paiements de loyer sont automatiquement vérifiés :
          </p>
          <ul className="text-sm space-y-2 ml-4 list-disc text-muted-foreground">
            <li>
              <strong>Le 5 de chaque mois</strong> : Première vérification et
              envoi automatique de la quittance si le paiement est détecté
            </li>
            <li>
              <strong>Le 10 de chaque mois</strong> : Seconde vérification pour
              les paiements non détectés le 5
            </li>
            <li>
              <strong>Alerte automatique</strong> : Vous êtes notifié si un
              loyer reste impayé après le 10
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
