/**
 * Génération de tokens sécurisés pour les invitations
 */

/**
 * Génère un token aléatoire sécurisé
 * @param length Longueur du token (par défaut 32 caractères)
 * @returns Token hexadécimal
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Génère une date d'expiration pour l'invitation
 * @param days Nombre de jours de validité (par défaut 7 jours)
 * @returns Date d'expiration ISO string
 */
export function generateExpirationDate(days: number = 7): string {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  return expirationDate.toISOString();
}

/**
 * Vérifie si un token est expiré
 * @param expiresAt Date d'expiration ISO string
 * @returns true si le token est expiré
 */
export function isTokenExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Génère l'URL complète d'acceptation d'invitation
 * @param token Token d'invitation
 * @returns URL complète
 */
export function generateInvitationUrl(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/accept-invitation?token=${token}`;
}
