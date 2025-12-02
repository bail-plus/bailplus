/**
 * Types pour l'API Bridge
 * Documentation: https://docs.bridgeapi.io/
 */

// ============================================
// AUTHENTIFICATION
// ============================================

export interface BridgeAuthResponse {
  access_token: string;
  expires_at: string;
  user: BridgeUser;
}

export interface BridgeUser {
  uuid: string;
  email?: string;
}

// ============================================
// BANQUES (INSTITUTIONS)
// ============================================

export interface BridgeBank {
  id: number;
  name: string;
  logo_url: string;
  country_code: string;
  capabilities: string[];
  form?: BridgeBankForm[];
}

export interface BridgeBankForm {
  label: string;
  type: 'USER' | 'PWD' | 'TEXT';
  isNum: boolean;
  maxLength?: number;
}

// ============================================
// ITEMS (Connexions bancaires)
// ============================================

export interface BridgeItem {
  id: number;
  bank_id: number;
  status: 0 | 1; // 0 = OK, 1 = erreur
  status_code_info?: string;
  status_code_description?: string;
}

// ============================================
// COMPTES BANCAIRES
// ============================================

export interface BridgeAccount {
  id: number;
  name: string;
  balance: number;
  status: 0 | 1;
  status_code_info?: string;
  iban: string;
  currency_code: string;
  item_id: number;
  bank_id: number;
  loan_details?: any;
  savings_details?: any;
  type: 'checking' | 'savings' | 'loan' | 'card';
}

// ============================================
// TRANSACTIONS
// ============================================

export interface BridgeTransaction {
  id: number;
  clean_description: string; // Description nettoyée
  bank_description: string; // Description brute de la banque
  amount: number; // Montant (positif = crédit, négatif = débit)
  date: string; // Format YYYY-MM-DD
  updated_at: string; // ISO 8601
  currency_code: string;
  account_id: number;
  category_id?: number;
  is_deleted: boolean;
  show_client_side: boolean;
}

export interface BridgeTransactionsResponse {
  resources: BridgeTransaction[];
  pagination: {
    next_uri: string | null;
  };
}

// ============================================
// CATÉGORIES
// ============================================

export interface BridgeCategory {
  id: number;
  name: string;
  parent_id: number | null;
}

// ============================================
// INSIGHTS (Analyse des transactions)
// ============================================

export interface BridgeInsight {
  account_id: number;
  date: string;
  category_id: number;
  amount: number;
}

// ============================================
// WEBHOOKS
// ============================================

export interface BridgeWebhook {
  url: string;
  events: string[];
}

export interface BridgeWebhookEvent {
  event_type: string;
  item_id?: number;
  account_id?: number;
  transaction_id?: number;
  timestamp: string;
}

// ============================================
// ERREURS
// ============================================

export interface BridgeError {
  code: string;
  message: string;
  documentation_url?: string;
}

// ============================================
// PARAMÈTRES DE REQUÊTE
// ============================================

export interface BridgeTransactionsParams {
  since?: string; // Date au format YYYY-MM-DD
  until?: string; // Date au format YYYY-MM-DD
  limit?: number; // Max 100
}

export interface BridgeAccountsParams {
  item_id?: number;
}

// ============================================
// CONNEXION UTILISATEUR (Connect Widget)
// ============================================

export interface BridgeConnectConfig {
  client_id: string;
  user_uuid: string;
  bank_id?: number; // Pré-sélectionner une banque
  country?: string; // 'FR', 'ES', 'IT', etc.
  onSuccess: (item: BridgeItem) => void;
  onExit?: () => void;
}
