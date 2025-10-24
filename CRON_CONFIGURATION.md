# Configuration du Cron Job pour vérification des paiements de loyer

## Objectif
Exécuter automatiquement la fonction `check-rent-payments` les **5 et 10 de chaque mois** pour:
1. Synchroniser les transactions bancaires depuis Bridge API
2. Matcher les transactions avec les loyers attendus
3. Marquer automatiquement les loyers comme payés
4. Générer les quittances de loyer en PDF

## Configuration avec Supabase Cron

### Option 1: pg_cron (Recommandé pour Supabase)

Créer une fonction SQL qui invoque l'Edge Function via HTTP:

```sql
-- Créer une fonction pour invoquer l'Edge Function
CREATE OR REPLACE FUNCTION invoke_check_rent_payments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  function_url text;
  service_role_key text;
BEGIN
  -- URL de la fonction (remplacer par votre project ref)
  function_url := 'https://xojzkwibfoqdydpbhvaf.supabase.co/functions/v1/check-rent-payments';

  -- Utiliser la clé service_role stockée dans vault ou en dur temporairement
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Invoquer via HTTP (nécessite l'extension pg_net)
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Scheduler le cron pour le 5 et 10 de chaque mois à 9h00
SELECT cron.schedule(
  'check-rent-payments-5th',
  '0 9 5 * *',  -- À 9h00 le 5 de chaque mois
  'SELECT invoke_check_rent_payments();'
);

SELECT cron.schedule(
  'check-rent-payments-10th',
  '0 9 10 * *',  -- À 9h00 le 10 de chaque mois
  'SELECT invoke_check_rent_payments();'
);
```

### Option 2: Service externe (GitHub Actions, Vercel Cron, etc.)

Créer un workflow GitHub Actions:

```yaml
# .github/workflows/check-rent-payments.yml
name: Check Rent Payments

on:
  schedule:
    # 5 de chaque mois à 9h00 UTC
    - cron: '0 9 5 * *'
    # 10 de chaque mois à 9h00 UTC
    - cron: '0 9 10 * *'
  workflow_dispatch: # Permet déclenchement manuel

jobs:
  check-payments:
    runs-on: ubuntu-latest
    steps:
      - name: Invoke Supabase Function
        run: |
          curl -X POST \
            'https://xojzkwibfoqdydpbhvaf.supabase.co/functions/v1/check-rent-payments' \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
```

### Option 3: Invocation manuelle pour test

Pour tester immédiatement:

```bash
curl -X POST \
  'https://xojzkwibfoqdydpbhvaf.supabase.co/functions/v1/check-rent-payments' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Prochaines étapes

1. Activer `pg_cron` dans votre projet Supabase (via Dashboard → Database → Extensions)
2. Activer `pg_net` dans votre projet Supabase (pour les appels HTTP)
3. Exécuter le script SQL ci-dessus via l'éditeur SQL Supabase
4. Vérifier les cron jobs installés:
   ```sql
   SELECT * FROM cron.job;
   ```

## Vérification des logs

Pour voir l'historique d'exécution:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```
