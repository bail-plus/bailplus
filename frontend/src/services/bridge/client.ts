import {
  BridgeAuthResponse,
  BridgeBank,
  BridgeAccount,
  BridgeTransaction,
  BridgeTransactionsResponse,
  BridgeTransactionsParams,
  BridgeItem,
  BridgeError,
} from './types';

/**
 * Client pour l'API Bridge
 * Documentation: https://docs.bridgeapi.io/
 */
export class BridgeClient {
  private baseUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_BRIDGE_BASE_URL || 'https://api.bridgeapi.io/v2';
    this.clientId = import.meta.env.VITE_BRIDGE_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_BRIDGE_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.warn(
        'Bridge API credentials not configured. Please set VITE_BRIDGE_CLIENT_ID and VITE_BRIDGE_CLIENT_SECRET'
      );
    }
  }

  // ============================================
  // AUTHENTIFICATION
  // ============================================

  /**
   * Créer un nouvel utilisateur Bridge
   * Chaque utilisateur de ton app doit avoir un user Bridge
   */
  async createUser(email?: string): Promise<BridgeAuthResponse> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': this.clientId,
        'Client-Secret': this.clientSecret,
      },
      body: JSON.stringify({
        email: email || undefined,
      }),
    });

    if (!response.ok) {
      const error: BridgeError = await response.json();
      throw new Error(`Failed to create user: ${error.message}`);
    }

    const data: BridgeAuthResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(data.expires_at);

    return data;
  }

  /**
   * Se connecter avec un utilisateur existant
   */
  async authenticateUser(userUuid: string): Promise<BridgeAuthResponse> {
    const response = await fetch(`${this.baseUrl}/users/${userUuid}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': this.clientId,
        'Client-Secret': this.clientSecret,
      },
    });

    if (!response.ok) {
      const error: BridgeError = await response.json();
      throw new Error(`Failed to authenticate user: ${error.message}`);
    }

    const data: BridgeAuthResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = new Date(data.expires_at);

    return data;
  }

  /**
   * Définir manuellement un access token
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Vérifier si le token est encore valide
   */
  private isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiresAt) {
      return false;
    }
    return new Date() < this.tokenExpiresAt;
  }

  /**
   * Headers d'authentification
   */
  private getAuthHeaders(): HeadersInit {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate first.');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
      'Client-Id': this.clientId,
      'Client-Secret': this.clientSecret,
    };
  }

  // ============================================
  // BANQUES
  // ============================================

  /**
   * Récupérer la liste des banques disponibles
   */
  async getBanks(country: string = 'FR'): Promise<BridgeBank[]> {
    const response = await fetch(
      `${this.baseUrl}/banks?country_code=${country}`,
      {
        headers: {
          'Client-Id': this.clientId,
          'Client-Secret': this.clientSecret,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get banks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.resources || [];
  }

  /**
   * Récupérer une banque par son ID
   */
  async getBank(bankId: number): Promise<BridgeBank> {
    const response = await fetch(`${this.baseUrl}/banks/${bankId}`, {
      headers: {
        'Client-Id': this.clientId,
        'Client-Secret': this.clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get bank: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================
  // ITEMS (Connexions bancaires)
  // ============================================

  /**
   * Récupérer les items (connexions bancaires) de l'utilisateur
   */
  async getItems(): Promise<BridgeItem[]> {
    const response = await fetch(`${this.baseUrl}/items`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get items: ${response.statusText}`);
    }

    const data = await response.json();
    return data.resources || [];
  }

  /**
   * Récupérer un item par son ID
   */
  async getItem(itemId: number): Promise<BridgeItem> {
    const response = await fetch(`${this.baseUrl}/items/${itemId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get item: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Supprimer un item (déconnecter une banque)
   */
  async deleteItem(itemId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/items/${itemId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.statusText}`);
    }
  }

  /**
   * Rafraîchir un item (forcer la synchronisation)
   */
  async refreshItem(itemId: number): Promise<BridgeItem> {
    const response = await fetch(`${this.baseUrl}/items/${itemId}/refresh`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh item: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================
  // COMPTES BANCAIRES
  // ============================================

  /**
   * Récupérer tous les comptes bancaires de l'utilisateur
   */
  async getAccounts(itemId?: number): Promise<BridgeAccount[]> {
    const url = itemId
      ? `${this.baseUrl}/accounts?item_id=${itemId}`
      : `${this.baseUrl}/accounts`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get accounts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.resources || [];
  }

  /**
   * Récupérer un compte par son ID
   */
  async getAccount(accountId: number): Promise<BridgeAccount> {
    const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get account: ${response.statusText}`);
    }

    return response.json();
  }

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Récupérer les transactions d'un compte
   */
  async getTransactions(
    accountId: number,
    params?: BridgeTransactionsParams
  ): Promise<BridgeTransaction[]> {
    const queryParams = new URLSearchParams();

    if (params?.since) queryParams.append('since', params.since);
    if (params?.until) queryParams.append('until', params.until);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/accounts/${accountId}/transactions${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`);
    }

    const data: BridgeTransactionsResponse = await response.json();
    return data.resources || [];
  }

  /**
   * Récupérer toutes les transactions de tous les comptes
   */
  async getAllTransactions(
    params?: BridgeTransactionsParams
  ): Promise<BridgeTransaction[]> {
    const queryParams = new URLSearchParams();

    if (params?.since) queryParams.append('since', params.since);
    if (params?.until) queryParams.append('until', params.until);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}/transactions${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`);
    }

    const data: BridgeTransactionsResponse = await response.json();
    return data.resources || [];
  }

  /**
   * Récupérer les transactions récentes (30 derniers jours)
   */
  async getRecentTransactions(): Promise<BridgeTransaction[]> {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    return this.getAllTransactions({
      since: since.toISOString().split('T')[0],
    });
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Générer l'URL du widget Bridge Connect
   * Le widget permet à l'utilisateur de se connecter à sa banque
   */
  getConnectUrl(userUuid: string, redirectUrl?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      user_uuid: userUuid,
      redirect_url: redirectUrl || window.location.origin,
    });

    return `https://connect.bridgeapi.io?${params.toString()}`;
  }

  /**
   * Vérifier si le client est configuré
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }
}
