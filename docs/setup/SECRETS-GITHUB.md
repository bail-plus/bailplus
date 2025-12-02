# Configuration des Secrets GitHub

## Pourquoi ?

Les variables d'environnement (comme les clés Supabase, Stripe, etc.) ne doivent **jamais** être commitées dans Git. Pour que ton application fonctionne en production, il faut les configurer comme "secrets" dans GitHub.

## Comment ajouter les secrets

### 1. Aller dans les settings du repository

1. Va sur GitHub : https://github.com/BAILOGENIUS/bailogenius-gestion-locative
2. Clique sur **Settings** (en haut à droite)
3. Dans le menu de gauche, clique sur **Secrets and variables** → **Actions**
4. Clique sur **New repository secret**

### 2. Ajouter chaque secret

Tu dois ajouter les secrets suivants (un par un) :

#### Secrets Supabase

- **Name**: `VITE_SUPABASE_PROJECT_ID`
  **Value**: `xojzkwibfoqdydpbhvaf`

- **Name**: `VITE_SUPABASE_PUBLISHABLE_KEY`
  **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhvanprd2liZm9xZHlkcGJodmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTI5MDYsImV4cCI6MjA3MTE2ODkwNn0.F7pCu-KPfJDGYIdmO1Cz3GUbbGVow4RwHYy2CpqO218`

- **Name**: `VITE_SUPABASE_URL`
  **Value**: `https://xojzkwibfoqdydpbhvaf.supabase.co`

- **Name**: `VITE_SUPABASE_FUNCTIONS_URL`
  **Value**: `https://xojzkwibfoqdydpbhvaf.functions.supabase.co`

#### Secrets Stripe

- **Name**: `VITE_STRIPE_PUBLISHABLE_KEY`
  **Value**: `pk_test_51ImiDQDBecmJsYgq0GEj56NKYIOv3qk7iCcVLYr7j4CvG1fmonDAy5RasCQ0LCl1iQhz1ot2GToE1Y0nJMFa1cWm00wLfkoWyj`

- **Name**: `VITE_STRIPE_PRICE_MONTHLY_STARTER`
  **Value**: `price_1S0PWADBecmJsYgqOdJwkZ2t`

- **Name**: `VITE_STRIPE_PRODUCT_KEY_STARTER`
  **Value**: `prod_T3PNNxnMlp72oM`

- **Name**: `VITE_STRIPE_PRICE_MONTHLY_STANDARD`
  **Value**: `price_1S7shRDBecmJsYgqxegV7I5Y`

- **Name**: `VITE_STRIPE_PRODUCT_KEY_STANDARD`
  **Value**: `prod_T3PNNxnMlp72oM`

- **Name**: `VITE_STRIPE_PRICE_MONTHLY_PREMIUM`
  **Value**: `price_1S7smgDBecmJsYgqKMmYCbn7`

- **Name**: `VITE_STRIPE_PRODUCT_KEY_PREMIUM`
  **Value**: `prod_T3QFeb35Pv0Bus`

#### Secrets Bridge API (Sandbox)

- **Name**: `VITE_BRIDGE_CLIENT_ID`
  **Value**: `sandbox_id_26f7005c2d934567bc9c540a659c6832`

- **Name**: `VITE_BRIDGE_CLIENT_SECRET`
  **Value**: `sandbox_secret_n8HMo5xMgrkMv4fqQNYdn9FeFbEoflqrmavEPzSrVbCSP5C5LxehVWbEglQfXLTJ`

- **Name**: `VITE_BRIDGE_BASE_URL`
  **Value**: `https://api.bridgeapi.io/v2`

- **Name**: `VITE_BRIDGE_ENV`
  **Value**: `sandbox`

## Vérification

Une fois tous les secrets ajoutés, tu devrais voir 15 secrets dans la liste :

```
✓ VITE_SUPABASE_PROJECT_ID
✓ VITE_SUPABASE_PUBLISHABLE_KEY
✓ VITE_SUPABASE_URL
✓ VITE_SUPABASE_FUNCTIONS_URL
✓ VITE_STRIPE_PUBLISHABLE_KEY
✓ VITE_STRIPE_PRICE_MONTHLY_STARTER
✓ VITE_STRIPE_PRODUCT_KEY_STARTER
✓ VITE_STRIPE_PRICE_MONTHLY_STANDARD
✓ VITE_STRIPE_PRODUCT_KEY_STANDARD
✓ VITE_STRIPE_PRICE_MONTHLY_PREMIUM
✓ VITE_STRIPE_PRODUCT_KEY_PREMIUM
✓ VITE_BRIDGE_CLIENT_ID
✓ VITE_BRIDGE_CLIENT_SECRET
✓ VITE_BRIDGE_BASE_URL
✓ VITE_BRIDGE_ENV
```

## Déployer

Une fois les secrets configurés :

```bash
git add .
git commit -m "Add environment variables support in Docker build"
git push origin main
```

Le GitHub Actions va automatiquement :
1. Récupérer les secrets
2. Les passer au build Docker
3. Vite va les intégrer dans le bundle JavaScript
4. Déployer l'application avec les bonnes variables

## Notes de sécurité

- ✅ Les secrets ne sont **jamais** visibles dans les logs GitHub Actions
- ✅ Les secrets ne sont **pas** commitables dans Git
- ✅ Seul toi (propriétaire du repo) peux les voir/modifier
- ⚠️ Les clés Supabase/Stripe publiques sont safe côté client (elles sont conçues pour ça)
- ⚠️ Ne JAMAIS commit les clés **secrètes** de Stripe ou Supabase (service_role_key, etc.)

## Environnements différents

Si tu veux avoir des secrets différents pour :
- **Sandbox** (test)
- **Production** (réel)

Tu peux créer des environments dans GitHub et avoir des secrets par environnement.
