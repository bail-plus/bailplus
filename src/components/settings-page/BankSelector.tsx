import { useState, useEffect } from 'react';
import { BridgeBank } from '@/services/bridge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface BankSelectorProps {
  selectedBankId: number | null;
  onSelect: (bank: BridgeBank) => void;
}

export function BankSelector({ selectedBankId, onSelect }: BankSelectorProps) {
  const [banks, setBanks] = useState<BridgeBank[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanks();
  }, []);

  const loadBanks = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('bridge-get-banks', {
        body: { country: 'FR' },
      });

      if (error) throw error;

      setBanks(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des banques:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Chargement des banques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Rechercher une banque..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 gap-2">
          {filteredBanks.map((bank) => (
            <button
              key={bank.id}
              onClick={() => onSelect(bank)}
              className={cn(
                'flex items-center gap-3 p-3 border rounded-lg hover:border-primary hover:bg-accent transition-all text-left',
                selectedBankId === bank.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              )}
            >
              {bank.logo_url ? (
                <img
                  src={bank.logo_url}
                  alt={bank.name}
                  className="w-10 h-10 object-contain rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{bank.name}</p>
                <p className="text-xs text-muted-foreground">
                  {bank.country_code}
                </p>
              </div>
              {selectedBankId === bank.id && (
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              )}
            </button>
          ))}
        </div>

        {filteredBanks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Aucune banque trouvée pour "{search}"
            </p>
          </div>
        )}
      </ScrollArea>

      <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
        <p className="font-semibold mb-1">🔒 Sécurité</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Connexion sécurisée via Bridge API (certifié PSD2)</li>
          <li>Aucun accès à vos identifiants bancaires</li>
          <li>Consentement révocable à tout moment</li>
          <li>Données chiffrées et conformes RGPD</li>
        </ul>
      </div>
    </div>
  );
}
