-- Enrichir la table bank_transactions pour Bridge API
-- Basé sur la doc Bridge: https://docs.bridgeapi.io/docs/transactions

-- Ajouter les colonnes manquantes pour Bridge API
ALTER TABLE bank_transactions
  ADD COLUMN IF NOT EXISTS bank_connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS account_id TEXT, -- ID du compte Bridge
  ADD COLUMN IF NOT EXISTS external_transaction_id TEXT UNIQUE, -- ID Bridge (ex: 33000191035700)
  ADD COLUMN IF NOT EXISTS clean_description TEXT, -- Description nettoyée par Bridge
  ADD COLUMN IF NOT EXISTS provider_description TEXT, -- Description brute de la banque
  ADD COLUMN IF NOT EXISTS booking_date DATE, -- Date de réservation
  ADD COLUMN IF NOT EXISTS transaction_date DATE, -- Date de transaction
  ADD COLUMN IF NOT EXISTS value_date DATE, -- Date de valeur
  ADD COLUMN IF NOT EXISTS bridge_updated_at TIMESTAMPTZ, -- Timestamp Bridge pour synchro progressive
  ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false, -- Si la transaction a été supprimée
  ADD COLUMN IF NOT EXISTS category_id INTEGER, -- ID de catégorie Bridge
  ADD COLUMN IF NOT EXISTS operation_type TEXT, -- Type d'opération (card, transfer, etc.)
  ADD COLUMN IF NOT EXISTS future BOOLEAN DEFAULT false, -- Si c'est une transaction future
  ADD COLUMN IF NOT EXISTS debtor_name TEXT, -- Nom du débiteur
  ADD COLUMN IF NOT EXISTS creditor_name TEXT, -- Nom du créditeur
  ADD COLUMN IF NOT EXISTS raw_data JSONB; -- Données brutes de Bridge pour référence

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_connection
  ON bank_transactions(bank_connection_id);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_external_id
  ON bank_transactions(external_transaction_id);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_account_id
  ON bank_transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_date
  ON bank_transactions(date);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_status
  ON bank_transactions(status);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_bridge_updated_at
  ON bank_transactions(bridge_updated_at);

-- Mettre à jour bank_connections pour stocker la date de dernière synchro
ALTER TABLE bank_connections
  ADD COLUMN IF NOT EXISTS last_transaction_sync_at TIMESTAMPTZ;

-- Commentaires pour documentation
COMMENT ON COLUMN bank_transactions.external_transaction_id IS 'ID unique de la transaction dans Bridge API';
COMMENT ON COLUMN bank_transactions.clean_description IS 'Description nettoyée et standardisée par Bridge';
COMMENT ON COLUMN bank_transactions.provider_description IS 'Description brute fournie par la banque';
COMMENT ON COLUMN bank_transactions.bridge_updated_at IS 'Timestamp de dernière mise à jour dans Bridge, utilisé pour le paramètre since';
COMMENT ON COLUMN bank_transactions.deleted IS 'Indique si la transaction a été supprimée par la banque';
COMMENT ON COLUMN bank_transactions.future IS 'Indique si c''est une transaction future (pas encore débitée)';
COMMENT ON COLUMN bank_connections.last_transaction_sync_at IS 'Date de dernière synchronisation des transactions, utilisée pour le paramètre since';
