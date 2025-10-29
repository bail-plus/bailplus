# Configuration Email Gratuite pour gaignerot.com

## Architecture Email 100% Gratuite

```
Emails personnels (recevoir + envoyer)
  → Cloudflare Email Routing (recevoir) - GRATUIT
  → Gmail (lire et envoyer) - GRATUIT
  → edouard.gaignerot@gaignerot.com
  → contact@gaignerot.com

Emails d'application (envoi uniquement)
  → Resend (gratuit, 100 emails/jour)
  → noreply@gaignerot.com
  → notifications@gaignerot.com
```

**💰 Coût total : 0€/mois**

---

## Partie 1 : Cloudflare Email Routing (Recevoir des emails)

### Étape 1 : Activer Email Routing

1. Va sur : https://dash.clookudflare.com
2. Sélectionne ton domaine **gaignerot.com**
3. Dans le menu de gauche, clique sur **Email** → **Email Routing**
4. Clique sur **Get started** (ou **Enable Email Routing**)

### Étape 2 : Configurer les enregistrements DNS

Cloudflare va automatiquement ajouter les enregistrements MX nécessaires :

```
Type: MX, Priority: 86, Name: @, Content: isaac.mx.cloudflare.net
Type: MX, Priority: 4, Name: @, Content: amir.mx.cloudflare.net
Type: MX, Priority: 17, Name: @, Content: linda.mx.cloudflare.net
```

Et un enregistrement TXT pour SPF :

```
Type: TXT, Name: @, Content: v=spf1 include:_spf.mx.cloudflare.net ~all
```

**Ces enregistrements sont ajoutés automatiquement**, vérifie juste qu'ils sont bien là dans **DNS** → **Records**.

### Étape 3 : Créer des adresses de redirection

1. Dans **Email Routing**, clique sur **Destination addresses**
2. Clique sur **Add destination address**
3. Entre ton email Gmail personnel (ex: `ton-email@gmail.com`)
4. **Vérifie l'email** que tu reçois pour confirmer

Ensuite, crée les alias :

1. Clique sur **Routing rules**
2. Clique sur **Create address**
3. Crée tes adresses :

```
edouard.gaignerot@gaignerot.com → ton-email@gmail.com
contact@gaignerot.com → ton-email@gmail.com
support@gaignerot.com → ton-email@gmail.com (optionnel)
```

### Étape 4 : Tester la réception

Envoie un email de test à `edouard.gaignerot@gaignerot.com` depuis un autre compte.

Tu devrais le recevoir dans ton Gmail ! ✅

---

## Partie 2 : Gmail (Envoyer des emails avec ton domaine)

### Étape 1 : Configurer "Send mail as" dans Gmail

1. Ouvre Gmail : https://mail.google.com
2. Clique sur **⚙️ Paramètres** (en haut à droite)
3. Va dans **Comptes et importation**
4. Dans **Envoyer des e-mails en tant que**, clique sur **Ajouter une autre adresse e-mail**
5. Entre :
   - **Nom** : Edouard Gaignerot (ou ton nom)
   - **Adresse e-mail** : `edouard.gaignerot@gaignerot.com`
   - Décoche **Traiter comme un alias**
6. Clique sur **Étape suivante**

### Étape 2 : Configurer le SMTP

Tu as deux options :

#### Option A : Utiliser le SMTP de Gmail (simple mais limité)

1. Choisis **Envoyer via les serveurs Gmail**
2. Clique sur **Ajouter un compte**

**Avantage** : Simple et rapide
**Inconvénient** : L'email peut afficher "via gmail.com"

#### Option B : Utiliser Resend SMTP (recommandé, professionnel)

Tu configureras ça après avoir configuré Resend (voir Partie 3).

SMTP Configuration :
- **Serveur SMTP** : `smtp.resend.com`
- **Port** : `465` (SSL) ou `587` (TLS)
- **Nom d'utilisateur** : `resend`
- **Mot de passe** : Ta clé API Resend

### Étape 3 : Vérifier l'adresse

Gmail va envoyer un code de vérification à `edouard.gaignerot@gaignerot.com`.

Grâce à Cloudflare Email Routing, tu vas recevoir ce code dans ton Gmail !

Entre le code pour valider.

### Étape 4 : Définir comme adresse par défaut (optionnel)

1. Dans **Comptes et importation**
2. À côté de `edouard.gaignerot@gaignerot.com`, clique sur **définir par défaut**

Maintenant, tous tes emails sortiront avec ton adresse @gaignerot.com ! 🎉

---

## Partie 3 : Resend (Emails d'application)

### Étape 1 : Créer un compte Resend

1. Va sur : https://resend.com
2. Clique sur **Start Building**
3. Inscris-toi (gratuit : 100 emails/jour, 3000/mois)

### Étape 2 : Ajouter ton domaine

1. Une fois connecté, va dans **Domains**
2. Clique sur **Add Domain**
3. Entre : `gaignerot.com`

### Étape 3 : Configurer les DNS

Resend va te donner des enregistrements DNS à ajouter dans Cloudflare :

**SPF** (si tu n'as pas déjà celui de Zoho, combine-les) :
```
Type: TXT
Name: @
Content: v=spf1 include:zoho.com include:_spf.resend.com ~all
TTL: Auto
```

**DKIM** :
```
Type: TXT
Name: resend._domainkey
Content: [Resend te donnera cette valeur]
TTL: Auto
```

**Enregistrement de vérification** :
```
Type: TXT
Name: _resend
Content: [Resend te donnera cette valeur]
TTL: Auto
```

### Étape 4 : Créer une clé API

1. Dans Resend, va dans **API Keys**
2. Clique sur **Create API Key**
3. Nom : `BailoGenius Production`
4. Permission : **Sending access**
5. Domaine : `gaignerot.com`
6. **Copie la clé** (tu ne pourras la voir qu'une fois !)

### Étape 5 : Utiliser Resend dans ton app

Exemple d'envoi d'email avec Resend :

```typescript
import { Resend } from 'resend';

const resend = new Resend('re_123456789'); // Ta clé API

await resend.emails.send({
  from: 'noreply@gaignerot.com',
  to: 'utilisateur@example.com',
  subject: 'Bienvenue sur BailoGenius !',
  html: '<p>Bienvenue...</p>'
});
```

---

## Alternative : Brevo (ex-Sendinblue) - Plus d'emails gratuits

Si tu dépasses les 100 emails/jour de Resend :

**Brevo** : 300 emails/jour gratuits
1. Va sur : https://www.brevo.com
2. Plan gratuit : 300 emails/jour
3. Configuration similaire à Resend

---

## Alternative : Improvmx - Service email complet gratuit

Si tu veux une vraie boîte email sans Gmail :

**Improvmx** : Totalement gratuit
1. Va sur : https://improvmx.com
2. Ajoute ton domaine
3. Configure les MX records
4. Reçois ET envoie des emails

---

## Récapitulatif de la configuration DNS

Voici tous les enregistrements DNS dans Cloudflare :

### Pour Cloudflare Email Routing (recevoir emails personnels)

```
# MX Records (ajoutés automatiquement par Cloudflare)
Type: MX, Priority: 86, Name: @, Content: isaac.mx.cloudflare.net
Type: MX, Priority: 4, Name: @, Content: amir.mx.cloudflare.net
Type: MX, Priority: 17, Name: @, Content: linda.mx.cloudflare.net

# SPF (ajouté automatiquement)
Type: TXT, Name: @, Content: v=spf1 include:_spf.mx.cloudflare.net ~all
```

### Pour Resend (envoyer emails d'application)

```
# Vérification Resend
Type: TXT, Name: _resend, Content: [valeur donnée par Resend]

# DKIM Resend
Type: TXT, Name: resend._domainkey, Content: [valeur donnée par Resend]
```

### Enregistrements de sécurité (recommandés)

```
# SPF combiné (si tu utilises Resend pour envoyer)
Type: TXT, Name: @, Content: v=spf1 include:_spf.mx.cloudflare.net include:_spf.resend.com ~all

# DMARC (politique anti-spam)
Type: TXT, Name: _dmarc, Content: v=DMARC1; p=quarantine; rua=mailto:postmaster@gaignerot.com
```

---

## Utilisation recommandée

### Emails personnels (Cloudflare Email Routing → Gmail)
- ✉️ `edouard.gaignerot@gaignerot.com` → Ton Gmail
- ✉️ `contact@gaignerot.com` → Ton Gmail
- ✉️ `support@gaignerot.com` → Ton Gmail (optionnel)

**Tu lis et envoies tout depuis Gmail avec ton adresse @gaignerot.com**

### Emails d'application (Resend)
- 📧 `noreply@gaignerot.com` - Notifications automatiques
- 📧 `notifications@gaignerot.com` - Alertes système
- 📧 `contact@bailogenius.gaignerot.com` - Formulaire de contact

---

## Intégration avec Supabase (pour BailoGenius)

### Option 1 : Utiliser Resend avec Supabase Edge Function

Crée une Edge Function pour envoyer des emails :

```typescript
// supabase/functions/send-email/index.ts
import { Resend } from 'npm:resend@3';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  const { to, subject, html } = await req.json();

  const data = await resend.emails.send({
    from: 'noreply@gaignerot.com',
    to,
    subject,
    html
  });

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### Option 2 : Configurer Supabase Auth avec Resend SMTP

Dans ton dashboard Supabase :
1. Va dans **Authentication** → **Email Templates**
2. Configure le SMTP avec Resend

**Avec Resend SMTP** :
```
SMTP Host: smtp.resend.com
SMTP Port: 465 (SSL) ou 587 (TLS)
SMTP Username: resend
SMTP Password: [ta clé API Resend]
Sender email: noreply@gaignerot.com
Sender name: BailoGenius
```

---

## Test de configuration

### Tester la réception (Cloudflare Email Routing)
1. Envoie un email à `edouard.gaignerot@gaignerot.com` depuis un autre compte
2. Vérifie dans ton Gmail, tu devrais le recevoir !

### Tester l'envoi (Resend)
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_123456789' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@gaignerot.com",
    "to": "ton-email@gmail.com",
    "subject": "Test Resend",
    "html": "<p>Test OK!</p>"
  }'
```

### Vérifier la délivrabilité
Teste ton domaine sur : https://www.mail-tester.com

---

## Coûts

- ✅ **Cloudflare Email Routing** : Gratuit illimité
- ✅ **Gmail** : Gratuit
- ✅ **Resend** : Gratuit (100 emails/jour, 3000/mois)
- ✅ **Cloudflare DNS** : Gratuit
- 💰 **Total** : **0€/mois**

### Si tu dépasses les limites gratuites

- **Resend** : 20$/mois pour 50 000 emails/mois
- **Brevo** : Gratuit jusqu'à 300 emails/jour (alternative gratuite)
- **Improvmx** : 9$/mois pour emails illimités avec boîte IMAP

---

## Support

Si tu as des problèmes :
1. Vérifie les DNS avec : https://mxtoolbox.com
2. Teste la délivrabilité : https://www.mail-tester.com
3. Vérifie les logs dans Cloudflare Email Routing
4. Vérifie les logs Resend

## Checklist

- [ ] Cloudflare Email Routing activé
- [ ] Adresses de redirection configurées (vers Gmail)
- [ ] Test de réception OK
- [ ] Gmail configuré pour envoyer avec @gaignerot.com
- [ ] Test d'envoi depuis Gmail OK
- [ ] Compte Resend créé
- [ ] Domaine vérifié dans Resend
- [ ] Clé API Resend créée
- [ ] Test d'envoi API Resend OK
- [ ] Configuration Supabase (optionnel)

## Résumé : Pourquoi cette solution ?

✅ **100% Gratuite** - Aucun coût
✅ **Simple** - Cloudflare fait tout automatiquement
✅ **Interface connue** - Tu utilises Gmail
✅ **Professionnel** - Ton adresse @gaignerot.com
✅ **Fiable** - Infrastructure Cloudflare + Google
✅ **Pas de maintenance** - Tout est géré pour toi

Tu as maintenant des emails professionnels sans rien payer ! 🎉
