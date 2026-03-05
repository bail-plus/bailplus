# Edge Function : Generate Monthly Invoices

## 📋 Description

Cette Edge Function génère automatiquement les **factures de loyer mensuelles** (quittances) pour tous les baux actifs.

Elle est conçue pour être exécutée :
- **Automatiquement** via un cron job Supabase (chaque 1er du mois)
- **Manuellement** via une requête HTTP (pour tests ou génération ponctuelle)

---

## 🚀 Fonctionnement

### Logique de génération

1. **Récupère tous les baux actifs** (`status = 'active'`)
2. **Filtre les baux dans la période active** (start_date ≤ aujourd'hui ≤ end_date)
3. **Vérifie si une facture existe déjà** pour le mois en cours
4. **Crée les factures manquantes** avec :
   - `period_month` et `period_year` = mois/année actuel(le)
   - `due_date` = le 5 du mois en cours
   - `status` = 'pending'
   - `total_amount` = rent_amount + charges_amount

### Protection contre les doublons

La fonction vérifie toujours si une facture existe déjà avant de la créer :

```typescript
const { data: existingInvoice } = await supabaseClient
  .from('rent_invoices')
  .select('id')
  .eq('lease_id', lease.id)
  .eq('period_month', currentMonth)
  .eq('period_year', currentYear)
  .maybeSingle();

if (existingInvoice) {
  continue; // Ne crée pas de doublon
}
```

**Résultat** : Tu peux déclencher la fonction plusieurs fois sans risque de doublons.

---

## 🔧 Configuration

### Fichiers

```
supabase/functions/generate-monthly-invoices/
├── index.ts          # Code principal de la fonction
├── .supafunc         # Configuration (désactive JWT)
└── README.md         # Cette documentation
```

### Variables d'environnement

La fonction utilise automatiquement ces variables (configurées par Supabase) :

- `SUPABASE_URL` : URL de ton projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` : Clé avec accès complet (gérée par Supabase)

**⚠️ Aucune configuration manuelle nécessaire !**

---

## 📅 Cron Job (Génération automatique)

### Configuration Supabase Dashboard

1. Va sur : https://supabase.com/dashboard/project/xojzkwibfoqdydpbhvaf/functions
2. Clique sur `generate-monthly-invoices`
3. Onglet **"Cron Jobs"** ou **"Schedules"**
4. Clique sur **"Create a new cron job"**

### Paramètres

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Name** | `monthly-invoice-generation` | Nom du cron job |
| **Schedule** | `0 0 1 * *` | Tous les 1er du mois à 00:00 UTC |
| **Type** | `Supabase Edge Function` | Type d'action |
| **Method** | `POST` | Méthode HTTP |
| **Edge Function** | `generate-monthly-invoices` | Nom de la fonction |
| **Timeout** | `60000` ms | Timeout de 60 secondes |
| **HTTP Headers** | (vide) | Pas de headers nécessaires |
| **HTTP Request Body** | `{}` ou vide | Pas de payload nécessaire |

### Explication du cron : `0 0 1 * *`

```
0 0 1 * *
│ │ │ │ │
│ │ │ │ └─── Jour de la semaine (0-7) : * = tous les jours
│ │ │ └───── Mois (1-12) : * = tous les mois
│ │ └─────── Jour du mois (1-31) : 1 = le 1er
│ └───────── Heure (0-23) : 0 = minuit
└─────────── Minute (0-59) : 0 = pile

= Tous les 1er du mois à 00:00 UTC
```

**⏰ Heure UTC** : Si tu es en France (UTC+1 ou UTC+2), le cron s'exécutera :
- **Hiver** : 1h du matin (UTC+1)
- **Été** : 2h du matin (UTC+2)

---

## 🧪 Tests

### Test manuel avec curl

```bash
curl -X POST 'https://xojzkwibfoqdydpbhvaf.supabase.co/functions/v1/generate-monthly-invoices'
```

### Réponse attendue

```json
{
  "success": true,
  "message": "Successfully generated 2 invoices for 10/2025",
  "invoicesCreated": 2,
  "details": {
    "totalLeases": 5,
    "activeLeases": 3,
    "newInvoices": 2
  }
}
```

**Détails de la réponse :**
- `totalLeases` : Nombre total de baux avec status='active' dans la BDD
- `activeLeases` : Nombre de baux dans leur période de validité (start_date ≤ aujourd'hui ≤ end_date)
- `newInvoices` : Nombre de nouvelles factures créées (exclut les doublons)

### Test depuis Supabase Dashboard

1. Va sur : https://supabase.com/dashboard/project/xojzkwibfoqdydpbhvaf/functions
2. Clique sur `generate-monthly-invoices`
3. Onglet **"Invocations"** ou **"Test"**
4. Clique sur **"Invoke function"**
5. Vérifie les logs et la réponse

---

## 📊 Vérifier les factures créées

### Dans l'application

1. **Page Comptabilité** : `/app/accounting` → Onglet "Loyers"
2. **Page Rapports** : `/app/reports` → Les données devraient être mises à jour

### Dans Supabase Dashboard

1. Va sur : https://supabase.com/dashboard/project/xojzkwibfoqdydpbhvaf/editor
2. Table `rent_invoices`
3. Filtre par `period_month` et `period_year` pour voir les factures du mois

### Requête SQL

```sql
SELECT
  ri.*,
  l.rent_amount,
  l.charges_amount,
  c.first_name,
  c.last_name
FROM rent_invoices ri
JOIN leases l ON ri.lease_id = l.id
JOIN contacts c ON l.tenant_id = c.id
WHERE ri.period_month = 10 AND ri.period_year = 2025
ORDER BY ri.created_at DESC;
```

---

## 🔒 Sécurité

### Authentification

- **JWT désactivé** : La fonction accepte les requêtes sans authentification
- **Pourquoi ?** Le cron job Supabase ne peut pas envoyer de JWT
- **Risque ?** Faible, car :
  - La fonction vérifie les doublons (pas de risque de spam)
  - Elle utilise le SERVICE_ROLE_KEY en interne (accès sécurisé aux données)
  - Le pire cas : quelqu'un déclenche la génération plusieurs fois (aucun impact)

### Permissions

La fonction utilise la **SERVICE_ROLE_KEY** qui :
- ✅ Accède à toutes les données (bypass RLS)
- ✅ Peut créer des factures pour tous les utilisateurs
- ✅ Ne peut être utilisée que côté serveur (jamais exposée au client)

---

## 🐛 Débogage

### Voir les logs

1. **Supabase Dashboard** : https://supabase.com/dashboard/project/xojzkwibfoqdydpbhvaf/functions
2. Clique sur `generate-monthly-invoices`
3. Onglet **"Logs"**

### Logs disponibles

```
[GENERATE-INVOICES] Function started
[GENERATE-INVOICES] Supabase client initialized
[GENERATE-INVOICES] No auth header - running as cron job
[GENERATE-INVOICES] Processing invoices for period - {"month":10,"year":2025,"dueDate":"2025-10-05"}
[GENERATE-INVOICES] Fetched leases - {"count":2}
[GENERATE-INVOICES] Active leases in date range - {"count":1}
[GENERATE-INVOICES] Prepared invoice for lease - {"leaseId":"xxx","totalAmount":1200,"tenant":"John Doe"}
[GENERATE-INVOICES] Invoices to create - {"count":1}
[GENERATE-INVOICES] Successfully created invoices - {"count":1}
```

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Error fetching leases: Could not find a relationship` | Mauvais nom de relation dans le SELECT | Vérifie les foreign keys dans types.ts |
| `Invalid JWT` | Tentative d'appel avec ANON_KEY alors que JWT est activé | Désactive JWT via `.supafunc` |
| `Missing authorization header` | JWT activé mais pas de header | Désactive JWT ou ajoute un header valide |
| `No active leases found` | Aucun bail avec status='active' | Normal si pas de baux actifs |

---

## 🔄 Déploiement

### Déployer une nouvelle version

```bash
cd "/Users/edouardgaignerot/Library/Mobile Documents/com~apple~CloudDocs/Desktop/PERSO/Gestion-locative/bailogenius-gestion-locative"

supabase functions deploy generate-monthly-invoices
```

### Vérifier le déploiement

```bash
# Test immédiat après déploiement
curl -X POST 'https://xojzkwibfoqdydpbhvaf.supabase.co/functions/v1/generate-monthly-invoices'
```

---

## 📈 Améliorations futures

### 1. Notifications email aux locataires

Ajouter l'envoi d'emails automatiques après génération :

```typescript
// TODO dans index.ts ligne 190-193
for (const invoice of createdInvoices) {
  await sendInvoiceEmail(invoice)
}
```

### 2. Génération de PDF

Générer automatiquement les quittances PDF :

```typescript
const pdfUrl = await generateInvoicePDF(invoice);
await supabaseClient
  .from('rent_invoices')
  .update({ pdf_url: pdfUrl })
  .eq('id', invoice.id);
```

### 3. Relances automatiques

Créer une fonction similaire pour relancer les impayés :

```bash
supabase functions deploy send-payment-reminders
```

---

## 📞 Support

En cas de problème :

1. **Vérifie les logs** dans Supabase Dashboard
2. **Teste manuellement** avec curl
3. **Vérifie la BDD** : table `rent_invoices`
4. **Contacte le support** Supabase si problème avec le cron

---

## 📝 Changelog

### Version 1.0.0 (2025-10-06)

- ✅ Génération automatique des factures mensuelles
- ✅ Protection contre les doublons
- ✅ Support des cron jobs Supabase
- ✅ Logs détaillés pour le débogage
- ✅ Configuration JWT désactivée pour le cron
