/**
 * Script de test pour le client Bridge API
 *
 * Pour l'exécuter :
 * 1. Ouvre la console du navigateur (F12)
 * 2. Copie-colle ce code dans la console
 * 3. Ou importe-le dans un composant React pour le tester
 */

import { BridgeClient } from './client';

export async function testBridgeClient() {
  console.log('🚀 Démarrage des tests Bridge API...\n');

  try {
    const client = new BridgeClient();

    // Test 1 : Vérifier la configuration
    console.log('📋 Test 1 : Vérification de la configuration');
    if (!client.isConfigured()) {
      throw new Error('❌ Client non configuré. Vérifie ton .env.local');
    }
    console.log('✅ Configuration OK\n');

    // Test 2 : Récupérer les banques françaises
    console.log('📋 Test 2 : Récupération des banques françaises');
    const banks = await client.getBanks('FR');
    console.log(`✅ ${banks.length} banques françaises trouvées`);
    console.log('Exemples:', banks.slice(0, 3).map(b => b.name));
    console.log('');

    // Test 3 : Créer un utilisateur de test
    console.log('📋 Test 3 : Création d\'un utilisateur de test');
    const user = await client.createUser('test@bailogenius.com');
    console.log('✅ Utilisateur créé:', user.user.uuid);
    console.log('Access token:', user.access_token.substring(0, 20) + '...');
    console.log('Expire le:', new Date(user.expires_at).toLocaleString('fr-FR'));
    console.log('');

    // Test 4 : Vérifier l'authentification
    console.log('📋 Test 4 : Vérification de l\'authentification');
    if (!client.isAuthenticated()) {
      throw new Error('❌ Utilisateur non authentifié');
    }
    console.log('✅ Utilisateur authentifié\n');

    // Test 5 : Récupérer les items (devrait être vide)
    console.log('📋 Test 5 : Récupération des items (connexions bancaires)');
    const items = await client.getItems();
    console.log(`✅ ${items.length} connexions bancaires trouvées`);
    if (items.length === 0) {
      console.log('ℹ️  Normal : aucune banque connectée pour l\'instant\n');
    } else {
      console.log('Items:', items);
    }

    // Test 6 : Récupérer les comptes (devrait être vide)
    console.log('📋 Test 6 : Récupération des comptes bancaires');
    const accounts = await client.getAccounts();
    console.log(`✅ ${accounts.length} comptes bancaires trouvés`);
    if (accounts.length === 0) {
      console.log('ℹ️  Normal : aucun compte pour l\'instant\n');
    } else {
      console.log('Comptes:', accounts);
    }

    // Test 7 : Générer l'URL de connexion Bridge Connect
    console.log('📋 Test 7 : Génération de l\'URL Bridge Connect');
    const connectUrl = client.getConnectUrl(user.user.uuid);
    console.log('✅ URL générée:', connectUrl);
    console.log('ℹ️  Cette URL permet à l\'utilisateur de connecter sa banque\n');

    // Résumé
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('\n📌 Prochaines étapes :');
    console.log('1. Intégrer Bridge Connect dans l\'interface utilisateur');
    console.log('2. Permettre au proprio de connecter sa banque');
    console.log('3. Récupérer les transactions et faire le matching');

    return {
      success: true,
      user,
      banks,
      items,
      accounts,
      connectUrl,
    };
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Pour tester depuis la console :
// import { testBridgeClient } from './src/services/bridge/test-client';
// testBridgeClient();
