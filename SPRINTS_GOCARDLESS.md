# 🚀 Plan de Sprints - Intégration GoCardless

## 📊 Vue d'ensemble

**Objectif** : Automatiser la vérification des paiements de loyer via GoCardless
**Durée totale estimée** : 4-5 sprints (8-10 jours)
**Optimisation** : 2 synchronisations par mois (le 5 et le 10) au lieu de quotidien

---

## 📅 Sprint 1 : Fondations Base de Données (1 jour)

### Objectifs
- ✅ Créer la structure de base de données
- ✅ Mettre en place les RLS policies
- ✅ Tester les migrations
- ✅ Régénérer les types TypeScript

### Tâches

#### 1.1 Créer la migration SQL
**Fichier** : `supabase/migrations/20251021_bank_integration.sql`

```sql
-- Table bank_connections
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  requisition_id TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL,

  consent_expires_at TIMESTAMPTZ NOT NULL,
  consent_status TEXT DEFAULT 'active' CHECK (consent_status IN ('active', 'expired', 'revoked')),

  iban TEXT,
  account_name TEXT,
  currency TEXT DEFAULT 'EUR',

  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT,
  last_sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_consent_expires ON bank_connections(consent_expires_at);

ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage their own bank connections"
  ON bank_connections FOR ALL
  USING (auth.uid() = user_id);

-- Modifications bank_transactions
ALTER TABLE bank_transactions
  ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id),
  ADD COLUMN IF NOT EXISTS external_transaction_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS debtor_name TEXT,
  ADD COLUMN IF NOT EXISTS creditor_name TEXT,
  ADD COLUMN IF NOT EXISTS raw_data JSONB;

CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_connection
  ON bank_transactions(bank_connection_id);

-- Modifications rent_invoices
ALTER TABLE rent_invoices
  ADD COLUMN IF NOT EXISTS auto_receipt_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_receipt_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_check_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_check_at TIMESTAMPTZ;
```

#### 1.2 Appliquer la migration
```bash
# En local
npx supabase db reset --local

# Régénérer les types TypeScript
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

#### 1.3 Vérification
```bash
# Se connecter à la BDD locale
npx supabase db shell

# Vérifier les tables
\dt bank_connections
\dt bank_transactions
\dt rent_invoices

# Tester l'insertion
INSERT INTO bank_connections (user_id, institution_id, institution_name, requisition_id, account_id, consent_expires_at)
VALUES (auth.uid(), 'BNPAFRPPXXX', 'BNP Paribas', 'test-req-id', 'test-account-id', NOW() + INTERVAL '90 days');

# Vérifier les RLS policies
SELECT * FROM bank_connections;
```

### Livrables
- ✅ Migration SQL appliquée et testée
- ✅ Tables créées et sécurisées avec RLS
- ✅ Types TypeScript régénérés
- ✅ Données de test insérées et validées

---

## 📅 Sprint 2 : Client API GoCardless (1 jour)

### Objectifs
- ✅ Créer un compte GoCardless
- ✅ Configurer les secrets
- ✅ Créer le client API GoCardless (nécessaire pour l'UI du Sprint 3)
- ✅ Créer les types TypeScript

### Tâches

#### 2.1 Configuration GoCardless
- [ ] Créer un compte sur https://gocardless.com/bank-account-data/
- [ ] Récupérer `SECRET_ID` et `SECRET_KEY`
- [ ] Configurer le compte en mode Sandbox pour les tests

#### 2.2 Ajouter les secrets

**En local** : Créer `.env.local` :
```bash
VITE_GOCARDLESS_SECRET_ID=your_secret_id
VITE_GOCARDLESS_SECRET_KEY=your_secret_key
VITE_GOCARDLESS_BASE_URL=https://bankaccountdata.gocardless.com/api/v2
```

**En production** : Via Dashboard Supabase → Project Settings → Edge Functions → Secrets
```bash
GOCARDLESS_SECRET_ID=your_secret_id
GOCARDLESS_SECRET_KEY=your_secret_key
GOCARDLESS_BASE_URL=https://bankaccountdata.gocardless.com/api/v2
```

#### 2.3 Créer le client API

**Fichier** : `src/services/gocardless/client.ts`

```typescript
export class GoCardlessClient {
  private baseUrl: string;
  private secretId: string;
  private secretKey: string;
  private token: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_GOCARDLESS_BASE_URL ||
                   'https://bankaccountdata.gocardless.com/api/v2';
    this.secretId = import.meta.env.VITE_GOCARDLESS_SECRET_ID || '';
    this.secretKey = import.meta.env.VITE_GOCARDLESS_SECRET_KEY || '';
  }

  /**
   * Obtenir un token d'authentification
   */
  async getToken(): Promise<string> {
    // Réutiliser le token s'il est encore valide
    if (this.token && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
      return this.token;
    }

    const response = await fetch(`${this.baseUrl}/token/new/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret_id: this.secretId,
        secret_key: this.secretKey,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.access;

    // Le token expire après 24h
    this.tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.token;
  }

  /**
   * Récupérer la liste des banques disponibles
   */
  async getInstitutions(country: string = 'FR'): Promise<any[]> {
    const token = await this.getToken();
    const response = await fetch(
      `${this.baseUrl}/institutions/?country=${country}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get institutions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Créer un agreement (consentement)
   */
  async createAgreement(institutionId: string, maxHistoricalDays: number = 730): Promise<any> {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}/agreements/enduser/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        institution_id: institutionId,
        max_historical_days: maxHistoricalDays, // 2 ans d'historique
        access_valid_for_days: 90, // Consentement valide 90 jours
        access_scope: ['balances', 'details', 'transactions'],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create agreement: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Créer une requisition (lien de connexion à la banque)
   */
  async createRequisition(
    institutionId: string,
    agreementId: string,
    redirectUrl: string
  ): Promise<any> {
    const token = await this.getToken();
    const response = await fetch(`${this.baseUrl}/requisitions/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirect: redirectUrl,
        institution_id: institutionId,
        agreement: agreementId,
        user_language: 'FR',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create requisition: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Récupérer les détails d'une requisition
   */
  async getRequisition(requisitionId: string): Promise<any> {
    const token = await this.getToken();
    const response = await fetch(
      `${this.baseUrl}/requisitions/${requisitionId}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get requisition: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Récupérer les détails d'un compte bancaire
   */
  async getAccountDetails(accountId: string): Promise<any> {
    const token = await this.getToken();
    const response = await fetch(
      `${this.baseUrl}/accounts/${accountId}/details/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get account details: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Récupérer les transactions d'un compte
   */
  async getTransactions(
    accountId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any> {
    const token = await this.getToken();
    const params = new URLSearchParams();

    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const url = `${this.baseUrl}/accounts/${accountId}/transactions/${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Récupérer les balances d'un compte
   */
  async getBalances(accountId: string): Promise<any> {
    const token = await this.getToken();
    const response = await fetch(
      `${this.baseUrl}/accounts/${accountId}/balances/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get balances: ${response.statusText}`);
    }

    return response.json();
  }
}
```

#### 2.4 Créer les types TypeScript

**Fichier** : `src/services/gocardless/types.ts`

```typescript
export interface Institution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
}

export interface Agreement {
  id: string;
  institution_id: string;
  created: string;
  max_historical_days: number;
  access_valid_for_days: number;
  access_scope: string[];
  accepted: string | null;
}

export interface Requisition {
  id: string;
  created: string;
  redirect: string;
  status: 'CR' | 'LN' | 'EX' | 'RJ' | 'SA' | 'GA';
  institution_id: string;
  agreement: string;
  accounts: string[];
  link: string;
}

export interface Transaction {
  transactionId: string;
  bookingDate: string;
  valueDate: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  debtorName?: string;
  creditorName?: string;
  remittanceInformationUnstructured?: string;
  proprietaryBankTransactionCode?: string;
}

export interface TransactionsResponse {
  transactions: {
    booked: Transaction[];
    pending: Transaction[];
  };
}
```

#### 2.5 Tester le client API

**Fichier** : `src/services/gocardless/__tests__/client.test.ts`

```typescript
import { GoCardlessClient } from '../client';

async function testClient() {
  const client = new GoCardlessClient();

  // Test 1 : Obtenir un token
  const token = await client.getToken();
  console.log('✅ Token obtenu:', token.substring(0, 20) + '...');

  // Test 2 : Récupérer les banques françaises
  const institutions = await client.getInstitutions('FR');
  console.log('✅ Nombre de banques FR:', institutions.length);

  // Test 3 : Créer un agreement
  const agreement = await client.createAgreement('BNPAFRPPXXX');
  console.log('✅ Agreement créé:', agreement.id);
}

testClient();
```

### Livrables
- ✅ Compte GoCardless créé et configuré
- ✅ Secrets configurés (local + production)
- ✅ Client API complet avec toutes les méthodes
- ✅ Types TypeScript créés
- ✅ Tests du client réussis

---

## 📅 Sprint 3 : Interface Utilisateur - Connexion Bancaire (2 jours)

### Objectifs
- ✅ Créer la page de paramètres bancaires
- ✅ Permettre au proprio de connecter sa banque
- ✅ Afficher le statut de la connexion
- ✅ Gérer le consentement et son expiration
- ✅ Créer une Edge Function pour gérer le callback de connexion

### Tâches

#### 3.1 Créer la page des paramètres bancaires

**Fichier** : `src/pages/settings/BankSettings.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { GoCardlessClient } from '@/services/gocardless/client';
import { BankConnectionStatus } from '@/components/settings/BankConnectionStatus';
import { BankSelector } from '@/components/settings/BankSelector';

export default function BankSettings() {
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [connection, setConnection] = useState<any>(null);

  useEffect(() => {
    loadBankConnection();
  }, []);

  const loadBankConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('consent_status', 'active')
      .single();

    setConnection(data);
  };

  const handleConnectBank = async () => {
    if (!selectedBank) return;

    setLoading(true);
    try {
      const client = new GoCardlessClient();

      // 1. Créer un agreement (consentement)
      const agreement = await client.createAgreement(selectedBank, 730);

      // 2. Créer une requisition (lien de connexion)
      const requisition = await client.createRequisition(
        selectedBank,
        agreement.id,
        `${window.location.origin}/settings/bank/callback`
      );

      // 3. Sauvegarder temporairement la requisition
      localStorage.setItem('pending_requisition', JSON.stringify({
        requisition_id: requisition.id,
        institution_id: selectedBank,
        institution_name: institutions.find(i => i.id === selectedBank)?.name,
      }));

      // 4. Rediriger vers la banque
      window.location.href = requisition.link;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      alert('Erreur lors de la connexion à la banque');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectBank = async () => {
    if (!connection) return;

    const confirm = window.confirm(
      'Voulez-vous vraiment déconnecter votre banque ? Les vérifications automatiques seront désactivées.'
    );

    if (confirm) {
      await supabase
        .from('bank_connections')
        .update({ consent_status: 'revoked' })
        .eq('id', connection.id);

      setConnection(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Connexion Bancaire</h1>
      <p className="text-gray-600 mb-8">
        Connectez votre compte bancaire pour vérifier automatiquement les paiements de loyer
        le 5 et le 10 de chaque mois.
      </p>

      {connection ? (
        <BankConnectionStatus
          connection={connection}
          onDisconnect={handleDisconnectBank}
        />
      ) : (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Connecter ma banque</h2>

          <div className="mb-6">
            <BankSelector
              selectedBank={selectedBank}
              onSelect={setSelectedBank}
            />
          </div>

          <Button
            onClick={handleConnectBank}
            disabled={!selectedBank || loading}
            loading={loading}
          >
            Connecter ma banque
          </Button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-sm mb-2">🔒 Sécurité</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Connexion sécurisée via GoCardless (certifié PSD2)</li>
              <li>• Aucun accès à vos identifiants bancaires</li>
              <li>• Consentement révocable à tout moment</li>
              <li>• Données chiffrées et conformes RGPD</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}
```

#### 3.2 Créer le composant de sélection de banque

**Fichier** : `src/components/settings/BankSelector.tsx`

```typescript
import { useState, useEffect } from 'react';
import { GoCardlessClient } from '@/services/gocardless/client';
import { Institution } from '@/services/gocardless/types';
import { Input } from '@/components/ui/input';

interface BankSelectorProps {
  selectedBank: string | null;
  onSelect: (bankId: string) => void;
}

export function BankSelector({ selectedBank, onSelect }: BankSelectorProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const client = new GoCardlessClient();
      const data = await client.getInstitutions('FR');
      setInstitutions(data);
    } catch (error) {
      console.error('Erreur lors du chargement des banques:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstitutions = institutions.filter((inst) =>
    inst.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div>Chargement des banques...</div>;
  }

  return (
    <div>
      <Input
        type="text"
        placeholder="Rechercher une banque..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredInstitutions.map((inst) => (
          <button
            key={inst.id}
            onClick={() => onSelect(inst.id)}
            className={`
              flex items-center gap-3 p-3 border rounded-lg hover:border-primary transition
              ${selectedBank === inst.id ? 'border-primary bg-primary/5' : 'border-gray-200'}
            `}
          >
            {inst.logo && (
              <img src={inst.logo} alt={inst.name} className="w-8 h-8 object-contain" />
            )}
            <span className="font-medium text-left">{inst.name}</span>
          </button>
        ))}
      </div>

      {filteredInstitutions.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          Aucune banque trouvée pour "{search}"
        </p>
      )}
    </div>
  );
}
```

#### 3.3 Créer le composant de statut de connexion

**Fichier** : `src/components/settings/BankConnectionStatus.tsx`

```typescript
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BankConnectionStatusProps {
  connection: any;
  onDisconnect: () => void;
}

export function BankConnectionStatus({ connection, onDisconnect }: BankConnectionStatusProps) {
  const expiresAt = new Date(connection.consent_expires_at);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isExpiringSoon = daysUntilExpiry <= 7;
  const isExpired = daysUntilExpiry < 0;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Connexion active</h2>
          <p className="text-gray-600">{connection.institution_name}</p>
        </div>
        {isExpired ? (
          <XCircle className="text-red-500" size={32} />
        ) : isExpiringSoon ? (
          <AlertCircle className="text-orange-500" size={32} />
        ) : (
          <CheckCircle className="text-green-500" size={32} />
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IBAN</span>
          <span className="font-mono">{connection.iban || '****'}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Nom du compte</span>
          <span>{connection.account_name || '-'}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Dernière synchronisation</span>
          <span>
            {connection.last_sync_at
              ? new Date(connection.last_sync_at).toLocaleDateString('fr-FR')
              : 'Jamais'}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Expiration du consentement</span>
          <span className={isExpiringSoon ? 'text-orange-600 font-semibold' : ''}>
            {expiresAt.toLocaleDateString('fr-FR')}
            {isExpiringSoon && !isExpired && ` (dans ${daysUntilExpiry} jours)`}
            {isExpired && ' (expiré)'}
          </span>
        </div>
      </div>

      {isExpiringSoon && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            {isExpired
              ? '⚠️ Votre consentement a expiré. Reconnectez votre banque pour continuer les vérifications automatiques.'
              : '⚠️ Votre consentement expire bientôt. Pensez à renouveler la connexion.'}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onDisconnect}>
          Déconnecter
        </Button>
        {isExpiringSoon && (
          <Button>Renouveler la connexion</Button>
        )}
      </div>
    </Card>
  );
}
```

#### 3.4 Créer l'Edge Function de callback

**Création** :
```bash
npx supabase functions new bank-connection-callback
```

**Fichier** : `supabase/functions/bank-connection-callback/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { requisition_id } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Récupérer les détails de la requisition
    const token = await getGocardlessToken();
    const requisitionResponse = await fetch(
      `${Deno.env.get('GOCARDLESS_BASE_URL')}/requisitions/${requisition_id}/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const requisition = await requisitionResponse.json();

    // 2. Vérifier que la requisition est bien acceptée
    if (requisition.status !== 'LN') {
      throw new Error('Requisition not linked');
    }

    // 3. Récupérer les détails du compte
    const accountId = requisition.accounts[0];
    const accountResponse = await fetch(
      `${Deno.env.get('GOCARDLESS_BASE_URL')}/accounts/${accountId}/details/`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const accountDetails = await accountResponse.json();
    const iban = accountDetails.account?.iban;

    // 4. Sauvegarder dans bank_connections
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('bank_connections').insert({
      user_id: user.id,
      institution_id: requisition.institution_id,
      institution_name: requisition.institution_name,
      requisition_id: requisition.id,
      account_id: accountId,
      consent_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      iban: iban ? `****${iban.slice(-4)}` : null,
      account_name: accountDetails.account?.ownerName,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function getGocardlessToken(): Promise<string> {
  const response = await fetch(
    `${Deno.env.get('GOCARDLESS_BASE_URL')}/token/new/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret_id: Deno.env.get('GOCARDLESS_SECRET_ID'),
        secret_key: Deno.env.get('GOCARDLESS_SECRET_KEY'),
      }),
    }
  );

  const data = await response.json();
  return data.access;
}
```

#### 3.5 Créer la page de callback

**Fichier** : `src/pages/settings/BankCallback.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function BankCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const requisitionId = searchParams.get('ref');

      if (!requisitionId) {
        throw new Error('No requisition ID');
      }

      // Récupérer les infos stockées
      const pendingData = localStorage.getItem('pending_requisition');
      if (!pendingData) {
        throw new Error('No pending requisition data');
      }

      const pending = JSON.parse(pendingData);

      // Appeler l'Edge Function pour finaliser la connexion
      const { data, error } = await supabase.functions.invoke('bank-connection-callback', {
        body: {
          requisition_id: requisitionId,
          institution_id: pending.institution_id,
          institution_name: pending.institution_name,
        },
      });

      if (error) throw error;

      // Nettoyer le localStorage
      localStorage.removeItem('pending_requisition');

      setStatus('success');
      setTimeout(() => navigate('/settings/bank'), 2000);
    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      setTimeout(() => navigate('/settings/bank'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold mb-2">Finalisation de la connexion...</h1>
            <p className="text-gray-600">Veuillez patienter</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 mb-4 text-6xl">✓</div>
            <h1 className="text-2xl font-bold mb-2">Connexion réussie !</h1>
            <p className="text-gray-600">Redirection en cours...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 mb-4 text-6xl">✗</div>
            <h1 className="text-2xl font-bold mb-2">Erreur de connexion</h1>
            <p className="text-gray-600">Redirection en cours...</p>
          </>
        )}
      </div>
    </div>
  );
}
```

### Livrables
- ✅ Page de paramètres bancaires complète
- ✅ Sélection de banque avec recherche
- ✅ Affichage du statut de connexion
- ✅ Edge Function de callback
- ✅ Gestion du consentement et de son expiration
- ✅ Flow complet testé (connexion → callback → sauvegarde)

---

## 📅 Sprint 4 : Edge Functions d'Automatisation (2 jours)

### Objectifs
- ✅ Créer l'Edge Function de synchronisation
- ✅ Créer les Edge Functions de vérification (J5 et J10)
- ✅ Optimiser pour 2 appels API par mois seulement

### Tâches

#### 4.1 Edge Function : Synchronisation des transactions

**Création** :
```bash
npx supabase functions new sync-bank-transactions
```

**Fichier** : `supabase/functions/sync-bank-transactions/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Récupérer toutes les connexions bancaires actives
    const { data: connections, error: connectionsError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('consent_status', 'active')
      .gt('consent_expires_at', new Date().toISOString());

    if (connectionsError) throw connectionsError;

    console.log(`Found ${connections?.length || 0} active bank connections`);

    // 2. Pour chaque connexion, récupérer les transactions
    for (const connection of connections || []) {
      try {
        // Récupérer les transactions des 30 derniers jours
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);

        const dateTo = new Date();

        const transactionsResponse = await fetch(
          `${Deno.env.get('GOCARDLESS_BASE_URL')}/accounts/${connection.account_id}/transactions/?date_from=${dateFrom.toISOString().split('T')[0]}&date_to=${dateTo.toISOString().split('T')[0]}`,
          {
            headers: {
              Authorization: `Bearer ${await getGocardlessToken()}`,
            },
          }
        );

        if (!transactionsResponse.ok) {
          throw new Error(`GoCardless API error: ${transactionsResponse.statusText}`);
        }

        const transactionsData = await transactionsResponse.json();

        // 3. Insérer les nouvelles transactions
        const bookedTransactions = transactionsData.transactions?.booked || [];

        for (const tx of bookedTransactions) {
          // Uniquement les transactions de crédit (reçues)
          const amount = parseFloat(tx.transactionAmount.amount);
          if (amount <= 0) continue;

          await supabase.from('bank_transactions').upsert(
            {
              bank_connection_id: connection.id,
              external_transaction_id: tx.transactionId,
              amount: amount,
              date: tx.bookingDate,
              label: tx.remittanceInformationUnstructured || '',
              debtor_name: tx.debtorName || null,
              creditor_name: tx.creditorName || null,
              status: 'unmatched',
              raw_data: tx,
              user_id: connection.user_id,
            },
            { onConflict: 'external_transaction_id' }
          );
        }

        // 4. Mettre à jour le statut de synchronisation
        await supabase
          .from('bank_connections')
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
            last_sync_error: null,
          })
          .eq('id', connection.id);

        console.log(
          `Synced ${bookedTransactions.length} transactions for connection ${connection.id}`
        );
      } catch (error) {
        console.error(`Error syncing connection ${connection.id}:`, error);

        // Enregistrer l'erreur
        await supabase
          .from('bank_connections')
          .update({
            last_sync_status: 'error',
            last_sync_error: error.message,
          })
          .eq('id', connection.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: connections?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-bank-transactions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function getGocardlessToken(): Promise<string> {
  const response = await fetch(
    `${Deno.env.get('GOCARDLESS_BASE_URL')}/token/new/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret_id: Deno.env.get('GOCARDLESS_SECRET_ID'),
        secret_key: Deno.env.get('GOCARDLESS_SECRET_KEY'),
      }),
    }
  );

  const data = await response.json();
  return data.access;
}
```

#### 4.2 Edge Function : Vérification des paiements (J5)

**Création** :
```bash
npx supabase functions new check-rent-payments-day5
```

**Fichier** : `supabase/functions/check-rent-payments-day5/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting payment check for day 5...');

    // 1. D'ABORD : Synchroniser les transactions bancaires
    console.log('Step 1: Syncing bank transactions...');
    await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/sync-bank-transactions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
      }
    );

    // 2. Récupérer tous les propriétaires avec connexion bancaire active
    const { data: connections } = await supabase
      .from('bank_connections')
      .select('user_id')
      .eq('consent_status', 'active');

    const userIds = [...new Set(connections?.map((c) => c.user_id) || [])];
    console.log(`Found ${userIds.length} users to check`);

    for (const userId of userIds) {
      // 3. Récupérer les factures impayées du mois en cours
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const { data: unpaidInvoices } = await supabase
        .from('rent_invoices')
        .select(`
          *,
          leases (
            tenant_id,
            profiles:tenant_id (first_name, last_name)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear);

      console.log(`Found ${unpaidInvoices?.length || 0} unpaid invoices for user ${userId}`);

      // 4. Pour chaque facture, chercher une transaction correspondante
      for (const invoice of unpaidInvoices || []) {
        const matchedTransaction = await findMatchingTransaction(
          supabase,
          userId,
          invoice
        );

        if (matchedTransaction) {
          console.log(`Match found for invoice ${invoice.id}`);

          // Marquer la transaction comme matchée
          await supabase
            .from('bank_transactions')
            .update({
              matched_rent_invoice_id: invoice.id,
              status: 'matched',
              match_score: matchedTransaction.score,
            })
            .eq('id', matchedTransaction.transaction.id);

          // Marquer la facture comme payée
          await supabase
            .from('rent_invoices')
            .update({
              status: 'paid',
              paid_date: matchedTransaction.transaction.date,
              payment_check_attempts: 1,
              last_payment_check_at: new Date().toISOString(),
            })
            .eq('id', invoice.id);

          // TODO: Générer et envoyer la quittance
          console.log(`TODO: Generate and send receipt for invoice ${invoice.id}`);
        } else {
          // Aucun match trouvé, incrémenter le compteur de tentatives
          await supabase
            .from('rent_invoices')
            .update({
              payment_check_attempts: 1,
              last_payment_check_at: new Date().toISOString(),
            })
            .eq('id', invoice.id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in check-rent-payments-day5:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function findMatchingTransaction(supabase: any, userId: string, invoice: any) {
  // Récupérer les transactions non matchées des 15 derniers jours
  const dateFrom = new Date(invoice.due_date);
  dateFrom.setDate(dateFrom.getDate() - 5); // 5 jours avant la due_date

  const dateTo = new Date();

  const { data: transactions } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'unmatched')
    .gte('date', dateFrom.toISOString().split('T')[0])
    .lte('date', dateTo.toISOString().split('T')[0]);

  let bestMatch = null;
  let bestScore = 0;

  for (const tx of transactions || []) {
    const score = calculateMatchScore(tx, invoice);

    if (score > bestScore && score >= 70) {
      bestScore = score;
      bestMatch = { transaction: tx, score };
    }
  }

  return bestMatch;
}

function calculateMatchScore(transaction: any, invoice: any): number {
  let score = 0;

  // Critère 1 : Montant exact (40 points)
  if (Math.abs(transaction.amount - invoice.total_amount) < 0.01) {
    score += 40;
  } else {
    // Montant proche à ±5% (20 points)
    const diff = Math.abs(transaction.amount - invoice.total_amount);
    if (diff / invoice.total_amount <= 0.05) {
      score += 20;
    }
  }

  // Critère 2 : Nom du locataire dans le libellé (30 points)
  const tenant = invoice.leases?.profiles;
  if (tenant) {
    const firstName = tenant.first_name?.toLowerCase() || '';
    const lastName = tenant.last_name?.toLowerCase() || '';
    const label = (transaction.label || '').toLowerCase();
    const debtorName = (transaction.debtor_name || '').toLowerCase();

    if (
      label.includes(firstName) ||
      label.includes(lastName) ||
      debtorName.includes(firstName) ||
      debtorName.includes(lastName)
    ) {
      score += 30;
    }
  }

  // Critère 3 : Date proche (±7 jours de la due_date) (20 points)
  const txDate = new Date(transaction.date);
  const dueDate = new Date(invoice.due_date);
  const daysDiff = Math.abs(
    (txDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 7) {
    score += 20;
  }

  // Critère 4 : Mots-clés liés au loyer (10 points)
  const label = (transaction.label || '').toLowerCase();
  const keywords = ['loyer', 'rent', 'appartement', 'logement'];
  if (keywords.some((kw) => label.includes(kw))) {
    score += 10;
  }

  return score;
}
```

#### 4.3 Edge Function : Vérification des paiements (J10)

**Création** :
```bash
npx supabase functions new check-rent-payments-day10
```

**Fichier** : `supabase/functions/check-rent-payments-day10/index.ts`

Identique à `check-rent-payments-day5` avec ces modifications :

```typescript
// Filtrer seulement les factures qui n'ont eu qu'une seule tentative
const { data: unpaidInvoices } = await supabase
  .from('rent_invoices')
  .select(`...`)
  .eq('user_id', userId)
  .eq('status', 'pending')
  .eq('period_month', currentMonth)
  .eq('period_year', currentYear)
  .eq('payment_check_attempts', 1); // ← NOUVELLE LIGNE

// Et mettre à jour le compteur à 2
await supabase
  .from('rent_invoices')
  .update({
    payment_check_attempts: 2,
    last_payment_check_at: new Date().toISOString(),
  })
  .eq('id', invoice.id);

// Envoyer une alerte au propriétaire si toujours impayé après le J10
// TODO: Implémenter l'envoi d'alerte
```

### Livrables
- ✅ 3 Edge Functions créées et déployées
- ✅ Synchronisation optimisée (2 fois par mois)
- ✅ Algorithme de matching fonctionnel

---

## 📅 Sprint 5 : Tests & Déploiement (2 jours)

### Objectifs
- ✅ Tester le flux complet
- ✅ Configurer les cron jobs
- ✅ Déployer en production

### Tâches

#### 5.1 Tests en environnement Sandbox
- [ ] Tester la connexion bancaire
- [ ] Tester la synchronisation des transactions
- [ ] Tester le matching
- [ ] Tester les cas limites (montants proches, dates limites, etc.)

#### 5.2 Configurer les cron jobs

**Option 1 : pg_cron (dans Supabase)**

```sql
SELECT cron.schedule(
  'check-payments-day5',
  '0 9 5 * *', -- Le 5 de chaque mois à 9h
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-rent-payments-day5',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'check-payments-day10',
  '0 9 10 * *', -- Le 10 de chaque mois à 9h
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-rent-payments-day10',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  );
  $$
);
```

**Option 2 : GitHub Actions (recommandé pour plus de contrôle)**

Créer `.github/workflows/check-payments.yml` :

```yaml
name: Check Rent Payments

on:
  schedule:
    # Le 5 de chaque mois à 9h UTC
    - cron: '0 9 5 * *'
    # Le 10 de chaque mois à 9h UTC
    - cron: '0 9 10 * *'
  workflow_dispatch: # Permet l'exécution manuelle

jobs:
  check-payments:
    runs-on: ubuntu-latest
    steps:
      - name: Determine which function to call
        id: function
        run: |
          DAY=$(date +%d)
          if [ "$DAY" == "05" ]; then
            echo "function=check-rent-payments-day5" >> $GITHUB_OUTPUT
          elif [ "$DAY" == "10" ]; then
            echo "function=check-rent-payments-day10" >> $GITHUB_OUTPUT
          fi

      - name: Call Edge Function
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/${{ steps.function.outputs.function }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

#### 5.3 Déploiement
```bash
# Déployer les Edge Functions
npx supabase functions deploy sync-bank-transactions
npx supabase functions deploy check-rent-payments-day5
npx supabase functions deploy check-rent-payments-day10

# Appliquer les migrations en production
npx supabase db push
```

### Livrables
- ✅ Tests complets réalisés
- ✅ Cron jobs configurés
- ✅ Déploiement en production réussi

---

## 📊 Récapitulatif

| Sprint | Durée | Tâches principales | Statut |
|--------|-------|-------------------|--------|
| Sprint 1 | 1j | Base de données + Migrations | ⏳ |
| Sprint 2 | 1j | Client API GoCardless | ⏳ |
| Sprint 3 | 2j | Interface utilisateur (UX/UI) | ⏳ |
| Sprint 4 | 2j | Edge Functions (automatisation) | ⏳ |
| Sprint 5 | 2j | Tests & Déploiement | ⏳ |

**Total : 8 jours**

---

## 🎯 Optimisation Coûts API

**Avant** : 30 appels/mois par user (quotidien)
**Après** : 2 appels/mois par user (le 5 et le 10)

**Économie** : **93% de réduction** des appels API GoCardless

---

## 📋 Checklist Globale

### Configuration
- [ ] Compte GoCardless créé
- [ ] Secrets configurés dans Supabase
- [ ] Variables d'environnement locales

### Base de données
- [ ] Migration appliquée
- [ ] RLS policies testées
- [ ] Types TypeScript régénérés

### Backend
- [ ] Client GoCardless complet
- [ ] Edge Functions déployées
- [ ] Algorithme de matching testé

### Frontend
- [ ] Page paramètres bancaires
- [ ] Flux de connexion
- [ ] Affichage du statut

### Automatisation
- [ ] Cron jobs configurés
- [ ] Tests en production
- [ ] Monitoring activé

---

**Prêt à commencer ? Par quel sprint veux-tu commencer ?**
