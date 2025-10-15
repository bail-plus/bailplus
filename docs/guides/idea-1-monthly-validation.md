# Idée 1 — Validation manuelle des loyers le 5 du mois

Objectif: générer automatiquement une ligne `rent_invoices` par bail et par mois, avec une date d'échéance au 5, puis permettre au propriétaire de « valider le paiement » le 5 (ou ensuite) pour marquer la facture comme payée.

## 1) Prérequis
- Des baux actifs existent dans `leases` (avec `start_date`, `rent_amount` et éventuellement `charges_amount`).
- Le code de la fonction Edge `generate-monthly-invoices` est présent dans `supabase/functions/generate-monthly-invoices`.
- Les tables existent côté BDD (voir `src/integrations/supabase/types.ts`):
  - `leases` (baux)
  - `rent_invoices` (écritures mensuelles: un enregistrement par bail et par mois)

Champs clés de `rent_invoices`:
- `lease_id`, `period_month`, `period_year`
- `due_date` (échéance, défini au 5 du mois)
- `rent_amount`, `charges_amount`, `total_amount`
- `status` (`pending|paid|late`) et `paid_date`

## 2) Déployer la fonction Edge

Depuis la racine du repo:

```bash
cd bailogenius-gestion-locative
supabase functions deploy generate-monthly-invoices
```

Vérifier dans le Dashboard Supabase → Project → Functions que `generate-monthly-invoices` est déployée.

## 3) Tester manuellement la génération

Déclenchement manuel (remplacer l’URL par celle de votre projet Supabase):

```bash
curl -X POST 'https://xojzkwibfoqdydpbhvaf.supabase.co/functions/v1/generate-monthly-invoices'
```

Résultat attendu: un JSON indiquant le nombre de factures créées pour le mois en cours. La fonction:
1. Récupère les baux actifs.
2. Vérifie si une facture existe déjà pour `period_month`/`period_year`.
3. Crée les factures manquantes avec `due_date` au 5 et `status='pending'`.

Vérifications:
- Dans le Dashboard Supabase → Table Editor → `rent_invoices` → filtrer par `period_month` et `period_year`.
- Requête SQL de contrôle:

```sql
SELECT ri.*
FROM rent_invoices ri
WHERE ri.period_month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND ri.period_year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY ri.created_at DESC;
```

Astuce pour re-tester: supprimer les factures du mois courant pour un bail donné, puis relancer la fonction.

```sql
DELETE FROM rent_invoices
WHERE lease_id = '<LEASE_ID>'
  AND period_month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND period_year = EXTRACT(YEAR FROM CURRENT_DATE);
```

## 4) Planification automatique (cron)

Dans Supabase → Functions → `generate-monthly-invoices` → onglet Cron/Schedules:

- Name: `monthly-invoice-generation`
- Schedule: `0 0 1 * *` (tous les 1er du mois à 00:00 UTC)
- Type: `Supabase Edge Function`
- Method: `POST`
- Function: `generate-monthly-invoices`

La fonction utilisera `due_date = 5` automatiquement.

## 5) Validation manuelle le 5 (status → paid)

En première itération (sans UI dédiée), valider depuis le Dashboard (edit row) ou via SQL:

```sql
UPDATE rent_invoices
SET status = 'paid', paid_date = CURRENT_DATE
WHERE id = '<RENT_INVOICE_ID>';
```

Validation en masse (exemple: tout ce qui est dû aujourd’hui pour une entité donnée):

```sql
UPDATE rent_invoices ri
SET status = 'paid', paid_date = CURRENT_DATE
FROM leases l
WHERE ri.lease_id = l.id
  AND ri.due_date = CURRENT_DATE
  AND ri.status = 'pending';
```

Améliorations possibles:
- Ajouter un bouton “Marquer payé” dans l’onglet Comptabilité (liste des loyers) pour faire cet update côté app.
- Ajouter des relances automatiques (job le 10/15) pour passer `status → late` si non payé.

## 6) Notifications le 5

Sans brancher un système email tout de suite, deux options simples:
- Badge/alerte dans `/app/accounting` si des `rent_invoices.status='pending'` avec `due_date <= CURRENT_DATE`.
- Notification in-app (table légère `notifications` ou simple calcul côté client) + toast.

## 7) Débogage

Logs de la fonction: Supabase → Functions → `generate-monthly-invoices` → onglet `Logs`.

Cas fréquents:
- Pas de baux actifs: aucune facture créée (normal).
- Doublons: la fonction vérifie déjà et ne recrée pas si la facture du mois existe.
- Montants: `total_amount = rent_amount + COALESCE(charges_amount, 0)`.

## 8) Étapes suivantes (optionnel)

- UI: lister les loyers du mois et bouton “Marquer payé”.
- Emails PDF quittance après validation.
- Relances automatiques et statut `late`.
- Connecteur bancaire et rapprochement automatique (plus tard).

