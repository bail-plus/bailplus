import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BankConnection {
  id: string;
  bank_name: string;
  bank_logo?: string;
  iban: string;
  account_name?: string;
  status: 'active' | 'expired' | 'error';
  last_sync_at?: string;
  created_at: string;
}

interface BankConnectionCardProps {
  connection: BankConnection;
  onRefresh: (id: string) => void;
  onDisconnect: (id: string) => void;
  refreshing?: boolean;
}

export function BankConnectionCard({
  connection,
  onRefresh,
  onDisconnect,
  refreshing = false,
}: BankConnectionCardProps) {
  const getStatusConfig = () => {
    switch (connection.status) {
      case 'active':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          badge: 'success',
          label: 'Actif',
        };
      case 'expired':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          badge: 'warning',
          label: 'Expiré',
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-500',
          badge: 'destructive',
          label: 'Erreur',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          badge: 'secondary',
          label: 'Inconnu',
        };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {connection.bank_logo ? (
              <img
                src={connection.bank_logo}
                alt={connection.bank_name}
                className="w-12 h-12 object-contain rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                <Building2 className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-semibold">{connection.bank_name}</h3>
              {connection.account_name && (
                <p className="text-sm text-muted-foreground">
                  {connection.account_name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusIcon className={cn('w-5 h-5', status.color)} />
            <Badge variant={status.badge as any}>{status.label}</Badge>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IBAN</span>
            <span className="font-mono">{connection.iban}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dernière synchronisation</span>
            <span>{formatDate(connection.last_sync_at)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Connecté le</span>
            <span>{formatDate(connection.created_at)}</span>
          </div>
        </div>

        {connection.status === 'expired' && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Votre connexion a expiré. Reconnectez votre banque pour
              continuer les vérifications automatiques.
            </p>
          </div>
        )}

        {connection.status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              ❌ Une erreur s'est produite lors de la dernière synchronisation.
              Essayez de rafraîchir la connexion.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisconnect(connection.id)}
            className="gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Déconnecter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
