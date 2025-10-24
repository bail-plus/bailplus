/**
 * Bridge API - Service d'intégration bancaire
 *
 * Ce module gère la connexion aux banques françaises via Bridge API
 * pour récupérer automatiquement les transactions et vérifier les paiements de loyer.
 */

export { BridgeClient } from './client';
export * from './types';
export { testBridgeClient } from './test-client';
