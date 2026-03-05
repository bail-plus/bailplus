# Déploiement Bridge API v3

## Résumé des changements

Le code a été refactorisé pour utiliser **Bridge API v3** au lieu de v2. Cette nouvelle approche est plus simple et plus sécurisée.

### Pourquoi les Edge Functions sont nécessaires ?

**SÉCURITÉ** : Les appels à Bridge API nécessitent `Client-Id` et `Client-Secret`. Ces credentials ne doivent **JAMAIS** être exposés dans le code frontend (navigateur). Les Edge Functions permettent de faire ces appels côté serveur de manière sécurisée.

## Nouvelles Edge Functions créées

### 1. `bridge-create-connect-session` (NOUVELLE - Remplace 2 anciennes fonctions)
- **Endpoint** : `/v3/aggregation/connect-sessions`
- **Rôle** : Crée une session de connexion Bridge et retourne l'URL de redirection
- **Remplace** : `bridge-create-user` + `bridge-get-connect-url`

### 2. `bridge-get-item` (NOUVELLE)
- **Endpoint** : `/v3/connect/items/{item_id}` + `/v3/connect/items/{item_id}/accounts`
- **Rôle** : Récupère les détails d'un item et ses comptes après connexion

### 3. `bridge-get-banks` (À CONSERVER)
- **Endpoint** : `/v2/banks`
- **Rôle** : Liste les banques disponibles (pour information uniquement, la sélection se fait sur Bridge)

## Changements dans le code frontend

### BankingTab.tsx
- ❌ Supprimé : Sélection de banque avec `BankSelector`
- ✅ Ajouté : Redirection directe vers Bridge Connect (Bridge gère la sélection)
- ✅ Simplifié : Un seul appel à `bridge-create-connect-session`

### BankCallback.tsx
- ❌ Supprimé : Authentification Bridge côté client
- ❌ Supprimé : Récupération du localStorage
- ✅ Ajouté : Appel à `bridge-get-item` pour récupérer les données de manière sécurisée

## Configuration requise

### 1. Variables d'environnement Supabase

Dans **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets** :

```bash
BRIDGE_CLIENT_ID=sandbox_id_26f7005c2d934567bc9c540a659c6832
BRIDGE_CLIENT_SECRET=sandbox_secret_o4cDM9OB54dhhOnKkhvlYWmZxlHg0B3L7frq003ZHS9pQmyD0HiyMKYnla9at8Dqo
```

### 2. Variables d'environnement locales (pour développement)

Créer le fichier `supabase/.env.local` :

```bash
BRIDGE_CLIENT_ID=sandbox_id_26f7005c2d934567bc9c540a659c6832
BRIDGE_CLIENT_SECRET=sandbox_secret_o4cDM9OB54dhhOnKkhvlYWmZxlHg0B3L7frq003ZHS9pQmyD0HiyMKYnla9at8Dqo
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

## Étapes de déploiement

### Prérequis
- Docker Desktop doit être lancé
- Supabase CLI installé

### 1. Déployer les Edge Functions

```bash
# Se positionner dans le projet
cd bailogenius-gestion-locative

# Déployer les 3 fonctions
npx supabase functions deploy bridge-create-connect-session
npx supabase functions deploy bridge-get-item
npx supabase functions deploy bridge-get-banks

# Définir les secrets
npx supabase secrets set BRIDGE_CLIENT_ID=sandbox_id_26f7005c2d934567bc9c540a659c6832
npx supabase secrets set BRIDGE_CLIENT_SECRET=sandbox_secret_o4cDM9OB54dhhOnKkhvlYWmZxlHg0B3L7frq003ZHS9pQmyD0HiyMKYnla9at8Dqo
```

### 2. Appliquer la migration

```bash
npx supabase db push
```

Ou via Dashboard Supabase → **SQL Editor** :

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bridge_user_uuid TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_bridge_user_uuid ON profiles(bridge_user_uuid);
```

### 3. Tester localement (optionnel)

```bash
# Démarrer Supabase local
npx supabase start

# Servir les Edge Functions localement
npx supabase functions serve --env-file supabase/.env.local

# Tester l'Edge Function
curl -i --location --request POST 'http://localhost:54321/functions/v1/bridge-create-connect-session' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"redirect_url": "http://localhost:5173/settings/bank-callback"}'
```

## Flow complet de connexion

1. **Utilisateur clique sur "Connecter une banque"**
   → Ouvre le dialog avec explications

2. **Utilisateur clique sur "Continuer vers Bridge"**
   → Frontend appelle Edge Function `bridge-create-connect-session`
   → Edge Function appelle Bridge API v3 `/v3/aggregation/connect-sessions`
   → Retourne une URL `https://connect.bridgeapi.io/session/{session-id}`
   → Redirection vers cette URL

3. **Sur Bridge Connect**
   → Utilisateur sélectionne sa banque
   → S'authentifie avec ses identifiants bancaires
   → Autorise l'accès aux transactions

4. **Callback après authentification**
   → Bridge redirige vers `/settings/bank-callback?item_id=XXX`
   → Frontend appelle Edge Function `bridge-get-item`
   → Edge Function récupère les détails de l'item et les comptes
   → Sauvegarde dans la table `bank_connections`
   → Redirection vers `/app/settings?tab=banking`

## Anciennes Edge Functions à supprimer (optionnel)

Ces fonctions ne sont plus utilisées avec v3 :
- `bridge-create-user` (remplacée par `bridge-create-connect-session`)
- `bridge-get-connect-url` (remplacée par `bridge-create-connect-session`)

## Vérification du déploiement

### Dans Supabase Dashboard
1. **Edge Functions** → Vérifier que les 3 fonctions sont déployées
2. **Edge Functions** → **Secrets** → Vérifier que les secrets sont définis
3. **Database** → **Tables** → **profiles** → Vérifier la colonne `bridge_user_uuid`

### Test manuel
1. Aller sur `/app/settings?tab=banking`
2. Cliquer sur "Connecter une banque"
3. Cliquer sur "Continuer vers Bridge"
4. Vérifier la redirection vers `connect.bridgeapi.io`
5. Compléter l'authentification
6. Vérifier que la connexion apparaît dans la liste

## Troubleshooting

### "Bridge API n'est pas configuré"
→ Vérifier que les variables d'environnement sont définies dans Supabase

### "Unauthorized" dans les Edge Functions
→ Vérifier que l'utilisateur est bien authentifié dans Supabase

### "CORS error"
→ Les Edge Functions gèrent automatiquement CORS, ce n'est plus un problème

### "Cannot connect to Docker daemon"
→ Lancer Docker Desktop avant de déployer

## Production

Pour passer en production (après les tests en sandbox) :

1. Créer un compte Bridge en production
2. Obtenir les credentials de production
3. Mettre à jour les secrets dans Supabase :
```bash
npx supabase secrets set BRIDGE_CLIENT_ID=prod_id_XXX
npx supabase secrets set BRIDGE_CLIENT_SECRET=prod_secret_XXX
```
4. Mettre à jour `.env.local` :
```bash
VITE_BRIDGE_ENV=production
```

## Documentation Bridge API

- [Bridge Connect v3](https://docs.bridgeapi.io/docs/connect-v3)
- [Bridge API Reference](https://docs.bridgeapi.io/reference)
