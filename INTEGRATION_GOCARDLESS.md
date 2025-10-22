# Documentation : Intégration GoCardless pour Vérification Automatique des Paiements de Loyer

## 📋 Vue d'ensemble

Cette intégration permet de :
1. Connecter le compte bancaire du propriétaire via GoCardless API
2. Récupérer automatiquement l'historique des transactions
3. Vérifier si les locataires ont payé leur loyer le 5 du mois
4. Revérifier le 10 si le paiement n'a pas été détecté le 5
5. Générer et envoyer automatiquement la quittance de loyer au locataire

---

## 🗄️ 1. Modifications de la Base de Données

### 1.1 Nouvelle table : `bank_connections`

Table pour stocker les connexions bancaires du propriétaire.

```sql
-- Création de la table bank_connections
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations GoCardless
  institution_id TEXT NOT NULL,           -- ID de la banque (ex: "BNPAFRPPXXX")
  institution_name TEXT NOT NULL,         -- Nom de la banque (ex: "BNP Paribas")
  requisition_id TEXT NOT NULL UNIQUE,    -- ID de la requisition GoCardless
  account_id TEXT NOT NULL,               -- ID du compte bancaire

  -- Consentement
  consent_expires_at TIMESTAMPTZ NOT NULL, -- Date d'expiration du consentement
  consent_status TEXT DEFAULT 'active',    -- active, expired, revoked

  -- Métadonnées
  iban TEXT,                               -- IBAN (masqué sauf 4 derniers caractères)
  account_name TEXT,                       -- Nom du compte
  currency TEXT DEFAULT 'EUR',

  -- Synchronisation
  last_sync_at TIMESTAMPTZ,               -- Dernière synchronisation réussie
  last_sync_status TEXT,                  -- success, error
  last_sync_error TEXT,                   -- Message d'erreur si échec

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_consent_expires ON bank_connections(consent_expires_at);

-- RLS Policies
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can manage their own bank connections"
  ON bank_connections
  FOR ALL
  USING (auth.uid() = user_id);
```

### 1.2 Modification de la table `bank_transactions`

Tu as déjà cette table, mais vérifions qu'elle contient bien tout ce qu'il faut :

```sql
-- Vérification des colonnes existantes
-- ✅ amount : Montant de la transaction
-- ✅ date : Date de la transaction
-- ✅ label : Libellé/description
-- ✅ matched_rent_invoice_id : Lien vers rent_invoices
-- ✅ status : Statut (matched, unmatched, ignored)
-- ✅ match_score : Score de matching (0-100)

-- Ajout de colonnes manquantes si nécessaire
ALTER TABLE bank_transactions
  ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id),
  ADD COLUMN IF NOT EXISTS external_transaction_id TEXT UNIQUE, -- ID GoCardless
  ADD COLUMN IF NOT EXISTS debtor_name TEXT, -- Nom du débiteur
  ADD COLUMN IF NOT EXISTS creditor_name TEXT, -- Nom du créditeur
  ADD COLUMN IF NOT EXISTS raw_data JSONB; -- Données brutes de GoCardless

CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_connection
  ON bank_transactions(bank_connection_id);
```

### 1.3 Modification de la table `rent_invoices`

Ajout d'un flag pour savoir si la quittance a été automatiquement générée/envoyée :

```sql
ALTER TABLE rent_invoices
  ADD COLUMN IF NOT EXISTS auto_receipt_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_receipt_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_check_attempts INTEGER DEFAULT 0, -- Nombre de vérifications (max 2: J5 et J10)
  ADD COLUMN IF NOT EXISTS last_payment_check_at TIMESTAMPTZ;
```

---

## 🔧 2. Configuration Supabase

### 2.1 Secrets (Variables d'environnement)

Dans Supabase Dashboard → Project Settings → Edge Functions → Secrets, ajoute :

```bash
GOCARDLESS_SECRET_ID=your_secret_id_here
GOCARDLESS_SECRET_KEY=your_secret_key_here
GOCARDLESS_BASE_URL=https://bankaccountdata.gocardless.com/api/v2
```

### 2.2 Edge Functions à créer

Tu vas créer 3 Edge Functions :

#### **a) `sync-bank-transactions`**
- Récupère les transactions depuis GoCardless
- Stocke dans `bank_transactions`
- **Exécution : Appelée automatiquement au début de `check-rent-payments-day5` et `check-rent-payments-day10`**
- **Optimisation : Seulement 2 fois par mois (le 5 et le 10) = 93% de réduction des coûts API**

#### **b) `check-rent-payments-day5`**
- **D'abord : Appelle `sync-bank-transactions` pour récupérer les dernières transactions**
- Vérifie les paiements le 5 de chaque mois
- Match transactions ↔️ rent_invoices
- Génère quittances si paiement détecté
- Exécution : Le 5 de chaque mois à 9h

#### **c) `check-rent-payments-day10`**
- **D'abord : Appelle `sync-bank-transactions` pour récupérer les dernières transactions**
- Revérifie les paiements non détectés le 5
- Match transactions ↔️ rent_invoices
- Génère quittances si paiement détecté
- Envoie une alerte au propriétaire si toujours impayé
- Exécution : Le 10 de chaque mois à 9h

---

## 📁 3. Structure des Fichiers à Créer

```
bailogenius-gestion-locative/
├── src/
│   ├── services/
│   │   ├── gocardless/
│   │   │   ├── client.ts              # Client API GoCardless
│   │   │   ├── auth.ts                # Gestion des tokens
│   │   │   ├── institutions.ts        # Liste des banques
│   │   │   ├── transactions.ts        # Récupération des transactions
│   │   │   └── consent.ts             # Gestion des consentements
│   │   ├── payment-matching/
│   │   │   ├── matcher.ts             # Algorithme de matching
│   │   │   ├── rules.ts               # Règles de matching
│   │   │   └── scorer.ts              # Calcul du score de matching
│   │   └── receipt-generator/
│   │       ├── generator.ts           # Génération de quittance PDF
│   │       └── sender.ts              # Envoi par email
│   ├── components/
│   │   └── settings/
│   │       ├── BankConnectionManager.tsx  # Interface de connexion bancaire
│   │       └── BankConnectionStatus.tsx   # Statut de la connexion
│   └── pages/
│       └── settings/
│           └── BankSettings.tsx       # Page paramètres bancaires
├── supabase/
│   ├── migrations/
│   │   └── 20251021_bank_integration.sql  # Migration BDD
│   └── functions/
│       ├── sync-bank-transactions/
│       │   └── index.ts
│       ├── check-rent-payments-day5/
│       │   └── index.ts
│       └── check-rent-payments-day10/
│           └── index.ts
└── INTEGRATION_GOCARDLESS.md          # Cette doc
```

---

## 🚀 4. Étapes d'Implémentation

### **ÉTAPE 1 : Migration de la Base de Données**

```bash
# Créer le fichier de migration
touch supabase/migrations/20251021_bank_integration.sql

# Copier le contenu SQL de la section 1.1, 1.2, 1.3
# Puis appliquer la migration
npx supabase db reset --local
```

### **ÉTAPE 2 : Créer le Client API GoCardless**

Fichier : `src/services/gocardless/client.ts`

```typescript
// Client pour communiquer avec l'API GoCardless
export class GoCardlessClient {
  private baseUrl = 'https://bankaccountdata.gocardless.com/api/v2';
  private token: string | null = null;

  async getToken(): Promise<string> {
    // Récupère un token d'authentification avec SECRET_ID et SECRET_KEY
    const response = await fetch(`${this.baseUrl}/token/new/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret_id: process.env.GOCARDLESS_SECRET_ID,
        secret_key: process.env.GOCARDLESS_SECRET_KEY,
      }),
    });
    const data = await response.json();
    this.token = data.access;
    return this.token;
  }

  async getTransactions(accountId: string, dateFrom?: string, dateTo?: string) {
    // Récupère les transactions d'un compte
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    const response = await fetch(
      `${this.baseUrl}/accounts/${accountId}/transactions/?${params}`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
      }
    );
    return response.json();
  }

  async getAccountDetails(accountId: string) {
    // Récupère les détails du compte (IBAN, nom, etc.)
    const response = await fetch(`${this.baseUrl}/accounts/${accountId}/details/`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    return response.json();
  }
}
```

### **ÉTAPE 3 : Créer l'Edge Function de Synchronisation**

```bash
npx supabase functions new sync-bank-transactions
```

Fichier : `supabase/functions/sync-bank-transactions/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { GoCardlessClient } from '../../../src/services/gocardless/client';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Récupérer toutes les connexions bancaires actives
    const { data: connections } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('consent_status', 'active')
      .lt('consent_expires_at', new Date().toISOString());

    const gcClient = new GoCardlessClient();
    await gcClient.getToken();

    // 2. Pour chaque connexion, récupérer les transactions
    for (const connection of connections || []) {
      const lastSync = connection.last_sync_at || '2024-01-01';
      const transactions = await gcClient.getTransactions(
        connection.account_id,
        lastSync,
        new Date().toISOString()
      );

      // 3. Insérer les nouvelles transactions dans bank_transactions
      for (const tx of transactions.transactions.booked) {
        await supabase.from('bank_transactions').upsert({
          bank_connection_id: connection.id,
          external_transaction_id: tx.transactionId,
          amount: parseFloat(tx.transactionAmount.amount),
          date: tx.bookingDate,
          label: tx.remittanceInformationUnstructured || '',
          debtor_name: tx.debtorName,
          creditor_name: tx.creditorName,
          status: 'unmatched',
          raw_data: tx,
          user_id: connection.user_id,
        }, { onConflict: 'external_transaction_id' });
      }

      // 4. Mettre à jour le statut de synchronisation
      await supabase
        .from('bank_connections')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
        })
        .eq('id', connection.id);
    }

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
```

### **ÉTAPE 4 : Créer l'Algorithme de Matching**

Fichier : `src/services/payment-matching/matcher.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export async function matchTransactionsToRentInvoices(userId: string) {
  const supabase = createClient(/* ... */);

  // 1. Récupérer les transactions non matchées
  const { data: transactions } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'unmatched')
    .gte('amount', 0); // Transactions positives = crédits

  // 2. Récupérer les factures de loyer impayées
  const { data: invoices } = await supabase
    .from('rent_invoices')
    .select(`
      *,
      leases (
        tenant_id,
        profiles (first_name, last_name)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'pending');

  // 3. Matcher chaque transaction avec une facture
  for (const tx of transactions || []) {
    let bestMatch = null;
    let bestScore = 0;

    for (const invoice of invoices || []) {
      const score = calculateMatchScore(tx, invoice);

      if (score > bestScore && score >= 70) { // Seuil de confiance : 70%
        bestScore = score;
        bestMatch = invoice;
      }
    }

    // 4. Si un match est trouvé, mettre à jour
    if (bestMatch) {
      await supabase
        .from('bank_transactions')
        .update({
          matched_rent_invoice_id: bestMatch.id,
          status: 'matched',
          match_score: bestScore,
        })
        .eq('id', tx.id);

      await supabase
        .from('rent_invoices')
        .update({
          status: 'paid',
          paid_date: tx.date,
        })
        .eq('id', bestMatch.id);
    }
  }
}

function calculateMatchScore(transaction: any, invoice: any): number {
  let score = 0;

  // Critère 1 : Montant exact (40 points)
  if (Math.abs(transaction.amount - invoice.total_amount) < 0.01) {
    score += 40;
  }

  // Critère 2 : Montant proche à ±5% (20 points)
  const diff = Math.abs(transaction.amount - invoice.total_amount);
  if (diff / invoice.total_amount <= 0.05) {
    score += 20;
  }

  // Critère 3 : Nom du locataire dans le libellé (30 points)
  const tenantName = `${invoice.leases.profiles.first_name} ${invoice.leases.profiles.last_name}`.toLowerCase();
  const label = (transaction.label || '').toLowerCase();
  if (label.includes(tenantName.split(' ')[0]) || label.includes(tenantName.split(' ')[1])) {
    score += 30;
  }

  // Critère 4 : Date proche (±5 jours de la due_date) (10 points)
  const txDate = new Date(transaction.date);
  const dueDate = new Date(invoice.due_date);
  const daysDiff = Math.abs((txDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 5) {
    score += 10;
  }

  return score;
}
```

### **ÉTAPE 5 : Créer les Edge Functions de Vérification**

```bash
npx supabase functions new check-rent-payments-day5
npx supabase functions new check-rent-payments-day10
```

Fichier : `supabase/functions/check-rent-payments-day5/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { matchTransactionsToRentInvoices } from '../../../src/services/payment-matching/matcher';
import { generateAndSendReceipt } from '../../../src/services/receipt-generator/sender';

Deno.serve(async (req) => {
  const supabase = createClient(/* ... */);

  // 1. Récupérer tous les propriétaires avec connexion bancaire active
  const { data: users } = await supabase
    .from('bank_connections')
    .select('user_id')
    .eq('consent_status', 'active');

  for (const user of users || []) {
    // 2. Lancer le matching des transactions
    await matchTransactionsToRentInvoices(user.user_id);

    // 3. Récupérer les factures payées qui n'ont pas encore de quittance
    const { data: paidInvoices } = await supabase
      .from('rent_invoices')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('status', 'paid')
      .eq('auto_receipt_sent', false);

    // 4. Générer et envoyer les quittances
    for (const invoice of paidInvoices || []) {
      await generateAndSendReceipt(invoice.id);

      await supabase
        .from('rent_invoices')
        .update({
          auto_receipt_sent: true,
          auto_receipt_sent_at: new Date().toISOString(),
        })
        .eq('id', invoice.id);
    }

    // 5. Marquer les factures vérifiées
    await supabase
      .from('rent_invoices')
      .update({
        payment_check_attempts: 1,
        last_payment_check_at: new Date().toISOString(),
      })
      .eq('user_id', user.user_id)
      .eq('status', 'pending')
      .lte('due_date', new Date().toISOString());
  }

  return new Response(JSON.stringify({ success: true }));
});
```

Le fichier `check-rent-payments-day10/index.ts` est identique mais avec :
- `payment_check_attempts: 2`
- Un filtre `.eq('payment_check_attempts', 1)` pour ne revérifier que celles du J5

### **ÉTAPE 6 : Créer l'Interface dans les Paramètres**

Fichier : `src/pages/settings/BankSettings.tsx`

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

export default function BankSettings() {
  const [loading, setLoading] = useState(false);

  const handleConnectBank = async () => {
    setLoading(true);
    try {
      // 1. Créer une requisition GoCardless
      const response = await fetch(
        'https://bankaccountdata.gocardless.com/api/v2/requisitions/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`, // Token obtenu côté serveur
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            redirect: `${window.location.origin}/settings/bank/callback`,
            institution_id: selectedBank, // ID de la banque choisie
            user_language: 'FR',
            agreement: agreementId, // Créé au préalable
          }),
        }
      );

      const data = await response.json();

      // 2. Rediriger l'utilisateur vers la banque
      window.location.href = data.link;
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Connexion Bancaire</h1>
      <p className="text-gray-600 mb-6">
        Connectez votre compte bancaire pour vérifier automatiquement les paiements de loyer.
      </p>

      <Button onClick={handleConnectBank} loading={loading}>
        Connecter ma banque
      </Button>

      {/* Affichage du statut de la connexion */}
      <BankConnectionStatus />
    </div>
  );
}
```

### **ÉTAPE 7 : Configurer les Cron Jobs**

**Option 1 : pg_cron (dans Supabase)**

Dans Supabase Dashboard → Database → Extensions, active `pg_cron` :

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Vérification des paiements le 5 de chaque mois à 9h
-- (sync-bank-transactions sera appelé automatiquement en premier)
SELECT cron.schedule(
  'check-payments-day5',
  '0 9 5 * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-rent-payments-day5',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  );
  $$
);

-- Vérification des paiements le 10 de chaque mois à 9h
-- (sync-bank-transactions sera appelé automatiquement en premier)
SELECT cron.schedule(
  'check-payments-day10',
  '0 9 10 * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-rent-payments-day10',
    headers := '{"Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb
  );
  $$
);
```

**Option 2 : GitHub Actions (recommandé)**

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

---

## 🔒 5. Sécurité

1. **Encryption des tokens** : Les tokens GoCardless sont stockés chiffrés dans Supabase Vault
2. **RLS Policies** : Chaque propriétaire ne voit que ses propres connexions
3. **IBAN masqué** : Seuls les 4 derniers chiffres sont visibles
4. **Audit logs** : Toutes les synchronisations sont tracées

---

## ✅ 6. Checklist de Mise en Place

- [ ] Créer un compte GoCardless (https://gocardless.com/bank-account-data/)
- [ ] Récupérer SECRET_ID et SECRET_KEY
- [ ] Ajouter les secrets dans Supabase
- [ ] Appliquer la migration SQL
- [ ] Créer les services GoCardless (`src/services/gocardless/`)
- [ ] Créer les 3 Edge Functions
- [ ] Créer l'interface de paramètres (`src/pages/settings/BankSettings.tsx`)
- [ ] Configurer les cron jobs
- [ ] Tester le flux complet en local
- [ ] Déployer en production

---

## 🧪 7. Tests

### Test manuel du flux complet :

1. **Connexion bancaire** :
   - Va dans Paramètres → Connexion bancaire
   - Clique sur "Connecter ma banque"
   - Choisis une banque de test (sandbox GoCardless)
   - Valide le consentement
   - Vérifie que la connexion apparaît dans `bank_connections`

2. **Synchronisation** :
   - Exécute manuellement : `npx supabase functions invoke sync-bank-transactions`
   - Vérifie que les transactions apparaissent dans `bank_transactions`

3. **Matching** :
   - Crée une facture de loyer avec `status = 'pending'`
   - Crée une transaction bancaire avec le même montant et une date proche
   - Exécute : `npx supabase functions invoke check-rent-payments-day5`
   - Vérifie que :
     - La transaction a `matched_rent_invoice_id` rempli
     - La facture a `status = 'paid'`
     - La quittance a été générée et envoyée

---

## 📞 Support

- Documentation GoCardless : https://nordigen.com/en/account_information_documenation/integration/quickstart_guide/
- Support Supabase : https://supabase.com/docs

---

## 🎯 Résumé du Flux

```
┌──────────────────────────────────────────────────────────────┐
│                     FLUX AUTOMATIQUE OPTIMISÉ                │
└──────────────────────────────────────────────────────────────┘

1. Le 5 du mois à 9h :
   ├─ sync-bank-transactions récupère les transactions des 30 derniers jours
   ├─ check-rent-payments-day5 vérifie les paiements
   └─ Si match trouvé :
      ├─ Marque rent_invoice.status = 'paid'
      ├─ Génère la quittance PDF
      └─ Envoie par email au locataire

2. Le 10 du mois à 9h (si paiement non détecté le 5) :
   ├─ sync-bank-transactions récupère les transactions des 30 derniers jours
   ├─ check-rent-payments-day10 revérifie les paiements non détectés
   └─ Si toujours impayé :
      └─ Envoie alerte au propriétaire

📊 Optimisation : Seulement 2 appels API GoCardless par mois
   au lieu de 30 (quotidien) = 93% de réduction des coûts
```

---

Voilà ! Tu as maintenant une documentation complète pour implémenter cette fonctionnalité. Dis-moi si tu veux que je commence à créer les fichiers ou si tu as des questions !
