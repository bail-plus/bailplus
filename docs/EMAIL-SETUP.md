# Configuration Email Gratuite pour gaignerot.com

## Architecture Email 100% Gratuite

```
Emails personnels (recevoir + envoyer)
  → Zoho Mail (gratuit, 5 utilisateurs)
  → edouard.gaignerot@gaignerot.com
  → contact@gaignerot.com

Emails d'application (envoi uniquement)
  → Resend (gratuit, 100 emails/jour)
  → noreply@gaignerot.com
  → notifications@gaignerot.com
```

---

## Partie 1 : Zoho Mail (Emails personnels)

### Étape 1 : Créer un compte Zoho Mail

1. Va sur : https://www.zoho.com/mail/
2. Clique sur **Sign Up Now**
3. Choisis **Forever Free Plan** (5 utilisateurs max)
4. Inscris-toi avec ton email perso (Gmail, etc.)

### Étape 2 : Ajouter ton domaine

1. Une fois connecté, va dans **Admin Console**
2. Clique sur **Add Domain**
3. Entre : `gaignerot.com`
4. Choisis **I have a domain**

### Étape 3 : Vérifier le domaine

Zoho va te demander d'ajouter un enregistrement TXT dans Cloudflare :

1. **Va dans Cloudflare** : https://dash.cloudflare.com
2. Sélectionne **gaignerot.com**
3. Va dans **DNS** → **Records**
4. Clique sur **Add record**
5. Ajoute l'enregistrement TXT que Zoho te donne :

```
Type: TXT
Name: @ (ou gaignerot.com)
Content: zoho-verification=zb123456789.zmverify.zoho.com
TTL: Auto
```

6. Retourne sur Zoho et clique sur **Verify**

### Étape 4 : Configurer les enregistrements MX

Dans Cloudflare, ajoute ces enregistrements MX :

```
Type: MX
Name: @ (ou gaignerot.com)
Priority: 10
Content: mx.zoho.com
TTL: Auto

Type: MX
Name: @ (ou gaignerot.com)
Priority: 20
Content: mx2.zoho.com
TTL: Auto

Type: MX
Name: @ (ou gaignerot.com)
Priority: 50
Content: mx3.zoho.com
TTL: Auto
```

### Étape 5 : Configurer SPF, DKIM, DMARC (Important pour la délivrabilité)

**SPF** (permet à Zoho d'envoyer des emails pour ton domaine) :
```
Type: TXT
Name: @ (ou gaignerot.com)
Content: v=spf1 include:zoho.com ~all
TTL: Auto
```

**DKIM** (Zoho te donnera cet enregistrement) :
```
Type: TXT
Name: zmail._domainkey
Content: [Zoho te donnera cette valeur]
TTL: Auto
```

**DMARC** (politique anti-spam) :
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:postmaster@gaignerot.com
TTL: Auto
```

### Étape 6 : Créer tes adresses email

1. Dans Zoho Admin Console
2. Va dans **Users** → **Add User**
3. Crée tes adresses :
   - `edouard.gaignerot@gaignerot.com`
   - `contact@gaignerot.com`
   - `support@gaignerot.com` (si besoin)

### Étape 7 : Accéder à ta boîte mail

**Webmail** : https://mail.zoho.com

**Application mobile** : Zoho Mail (iOS/Android)

**Configurer dans Gmail/Outlook** :
- **IMAP** : `imap.zoho.com:993` (SSL)
- **SMTP** : `smtp.zoho.com:465` (SSL)
- **Username** : ton email complet
- **Password** : ton mot de passe Zoho

---

## Partie 2 : Resend (Emails d'application)

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

## Partie 3 : Alternative - Brevo (ex-Sendinblue)

Si tu veux plus de 100 emails/jour gratuits :

**Brevo** : 300 emails/jour gratuits
1. Va sur : https://www.brevo.com
2. Plan gratuit : 300 emails/jour
3. Configuration similaire à Resend

---

## Récapitulatif de la configuration DNS

Voici tous les enregistrements DNS à ajouter dans Cloudflare :

### Pour Zoho Mail (recevoir/envoyer emails personnels)

```
# MX Records (pour recevoir)
Type: MX, Priority: 10, Name: @, Content: mx.zoho.com
Type: MX, Priority: 20, Name: @, Content: mx2.zoho.com
Type: MX, Priority: 50, Name: @, Content: mx3.zoho.com

# Vérification Zoho
Type: TXT, Name: @, Content: zoho-verification=zb123456789.zmverify.zoho.com

# DKIM Zoho
Type: TXT, Name: zmail._domainkey, Content: [valeur donnée par Zoho]
```

### Pour Resend (envoyer emails d'application)

```
# Vérification Resend
Type: TXT, Name: _resend, Content: [valeur donnée par Resend]

# DKIM Resend
Type: TXT, Name: resend._domainkey, Content: [valeur donnée par Resend]
```

### Enregistrements communs (SPF + DMARC)

```
# SPF (combine Zoho + Resend)
Type: TXT, Name: @, Content: v=spf1 include:zoho.com include:_spf.resend.com ~all

# DMARC (politique anti-spam)
Type: TXT, Name: _dmarc, Content: v=DMARC1; p=quarantine; rua=mailto:postmaster@gaignerot.com
```

---

## Utilisation recommandée

### Emails personnels (Zoho Mail)
- ✉️ `edouard.gaignerot@gaignerot.com` - Ton email principal
- ✉️ `contact@gaignerot.com` - Contact public
- ✉️ `support@gaignerot.com` - Support client

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

### Option 2 : Configurer Supabase Auth avec Resend/SMTP

Dans ton dashboard Supabase :
1. Va dans **Authentication** → **Email Templates**
2. Configure le SMTP avec Zoho ou Resend

**Avec Zoho SMTP** :
```
SMTP Host: smtp.zoho.com
SMTP Port: 465
SMTP Username: noreply@gaignerot.com
SMTP Password: [ton mot de passe Zoho]
Sender email: noreply@gaignerot.com
Sender name: BailoGenius
```

---

## Test de configuration

### Tester la réception (Zoho)
1. Envoie un email à `edouard.gaignerot@gaignerot.com` depuis Gmail
2. Vérifie dans https://mail.zoho.com

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

- ✅ **Zoho Mail** : Gratuit (5 utilisateurs, 5 Go/utilisateur)
- ✅ **Resend** : Gratuit (100 emails/jour, 3000/mois)
- ✅ **Cloudflare DNS** : Gratuit
- 💰 **Total** : 0€/mois

### Si tu dépasses les limites gratuites

- **Zoho Mail** : 1€/utilisateur/mois pour plus de stockage
- **Resend** : 20$/mois pour 50 000 emails/mois
- **Brevo** : Gratuit jusqu'à 300 emails/jour (alternative)

---

## Support

Si tu as des problèmes :
1. Vérifie les DNS avec : https://mxtoolbox.com
2. Teste la délivrabilité : https://www.mail-tester.com
3. Vérifie les logs Resend/Zoho

## Checklist

- [ ] Compte Zoho Mail créé
- [ ] Domaine vérifié dans Zoho
- [ ] Enregistrements MX ajoutés dans Cloudflare
- [ ] SPF/DKIM/DMARC configurés
- [ ] Adresses email créées dans Zoho
- [ ] Test de réception OK
- [ ] Compte Resend créé
- [ ] Domaine vérifié dans Resend
- [ ] Clé API Resend créée
- [ ] Test d'envoi OK
- [ ] Configuration Supabase (optionnel)
