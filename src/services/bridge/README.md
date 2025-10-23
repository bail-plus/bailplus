# Bridge API - Service d'intégration bancaire 🏦

Service pour connecter les comptes bancaires français via Bridge API et récupérer automatiquement les transactions.

## 📋 Configuration

### 1. Créer un compte Bridge

1. Va sur https://dashboard.bridgeapi.io/signup
2. Crée un compte
3. Active le mode **Sandbox**
4. Récupère tes clés :
   - `Client ID`
   - `Client Secret`

### 2. Configurer les variables d'environnement

Ajoute dans `.env.local` :

```bash
VITE_BRIDGE_CLIENT_ID=sandbox_id_xxxxxxxxxxxxx
VITE_BRIDGE_CLIENT_SECRET=sandbox_secret_xxxxxxxxxxxxx
VITE_BRIDGE_BASE_URL=https://api.bridgeapi.io/v2
VITE_BRIDGE_ENV=sandbox
```

## 🚀 Utilisation

### Importer le client

```typescript
import { BridgeClient } from '@/services/bridge';
```

### Créer une instance

```typescript
const client = new BridgeClient();
```

### Créer un utilisateur

```typescript
// Chaque utilisateur de ton app doit avoir un user Bridge
const user = await client.createUser('user@example.com');
console.log(user.user.uuid); // UUID de l'utilisateur Bridge
console.log(user.access_token); // Token d'accès
```

### Récupérer les banques disponibles

```typescript
const banks = await client.getBanks('FR');
console.log(banks); // Liste des banques françaises
```

### Connecter une banque (Bridge Connect)

```typescript
// Générer l'URL du widget de connexion
const connectUrl = client.getConnectUrl(userUuid, 'https://monapp.com/callback');

// Rediriger l'utilisateur vers cette URL
window.location.href = connectUrl;

// L'utilisateur se connecte à sa banque
// Bridge redirige vers ton callback avec les infos de connexion
```

### Récupérer les comptes

```typescript
const accounts = await client.getAccounts();
console.log(accounts); // Liste des comptes bancaires
```

### Récupérer les transactions

```typescript
// Transactions d'un compte spécifique
const transactions = await client.getTransactions(accountId, {
  since: '2024-01-01',
  until: '2024-12-31',
  limit: 100,
});

// Transactions des 30 derniers jours (tous comptes)
const recentTransactions = await client.getRecentTransactions();
```

### Rafraîchir une connexion bancaire

```typescript
// Forcer la synchronisation
await client.refreshItem(itemId);
```

### Déconnecter une banque

```typescript
await client.deleteItem(itemId);
```

## 🧪 Tester le client

```typescript
import { testBridgeClient } from '@/services/bridge';

// Exécuter tous les tests
const result = await testBridgeClient();
console.log(result);
```

## 📊 Structure des données

### BridgeTransaction

```typescript
{
  id: 12345,
  clean_description: "Paiement loyer Jean Dupont",
  bank_description: "VIREMENT JEAN DUPONT REF LOYER",
  amount: 850.50,  // Positif = crédit, négatif = débit
  date: "2024-10-15",
  currency_code: "EUR",
  account_id: 67890,
  category_id: 123,
  is_deleted: false
}
```

### BridgeAccount

```typescript
{
  id: 67890,
  name: "Compte courant",
  balance: 15420.75,
  iban: "FR76XXXXXXXXXXXXXXXXXXXXXXX",
  currency_code: "EUR",
  type: "checking",
  item_id: 111,
  bank_id: 222
}
```

### BridgeBank

```typescript
{
  id: 222,
  name: "BNP Paribas",
  logo_url: "https://...",
  country_code: "FR",
  capabilities: ["ais", "pis"]
}
```

## 🔐 Sécurité

- Les tokens expirent automatiquement
- Ne jamais stocker `CLIENT_SECRET` côté client
- Utiliser HTTPS uniquement
- Masquer les IBAN (afficher seulement les 4 derniers chiffres)

## 🔗 Liens utiles

- Documentation Bridge : https://docs.bridgeapi.io/
- Dashboard : https://dashboard.bridgeapi.io/
- Support : support@bridgeapi.io

## 📝 Notes importantes

1. **Sandbox vs Production**
   - Sandbox : Gratuit, données de test
   - Production : Payant (~0,10€ par connexion)

2. **Limites API**
   - 100 transactions max par requête
   - Utiliser la pagination pour plus

3. **Webhooks**
   - Configure des webhooks pour être notifié des nouvelles transactions
   - Plus efficace que de poll l'API

4. **Catégories**
   - Bridge catégorise automatiquement les transactions
   - Utilise `category_id` pour filtrer

## 🐛 Debug

```typescript
// Vérifier la configuration
console.log(client.isConfigured()); // true/false

// Vérifier l'authentification
console.log(client.isAuthenticated()); // true/false

// Définir un token manuellement
client.setAccessToken('mon-token');
```
