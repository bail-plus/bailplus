# Configuration de l'authentification Google avec Supabase

Ce guide explique comment configurer Sign in with Google pour votre application de gestion locative.

## Prérequis

- Un compte Google (gratuit)
- Un projet Supabase actif
- Accès au tableau de bord Supabase

## Étape 1 : Configuration dans Google Cloud Console

### 1.1 Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. En haut de la page, cliquez sur le sélecteur de projet
3. Cliquez sur **Nouveau projet**
4. Donnez un nom à votre projet (ex: "Gestion Locative")
5. Cliquez sur **Créer**
6. Attendez que le projet soit créé et sélectionnez-le

### 1.2 Configurer l'écran de consentement OAuth

1. Dans le menu de gauche, allez dans **API et services** > **Écran de consentement OAuth**
2. Sélectionnez **Externe** (pour permettre à n'importe qui de se connecter)
3. Cliquez sur **Créer**
4. Remplissez les informations obligatoires :
   - **Nom de l'application** : Le nom de votre application (ex: "Gestion Locative")
   - **Adresse e-mail de l'assistance utilisateur** : Votre adresse email
   - **Logo de l'application** : Optionnel
   - **Domaine de l'application** : Optionnel en développement
   - **Adresse e-mail du développeur** : Votre adresse email
5. Cliquez sur **Enregistrer et continuer**
6. Pour les **Champs d'application** (Scopes) :
   - Cliquez sur **Ajouter ou supprimer des champs d'application**
   - Sélectionnez : `./auth/userinfo.email` et `./auth/userinfo.profile`
   - Cliquez sur **Mettre à jour**
7. Cliquez sur **Enregistrer et continuer**
8. Ajoutez des **utilisateurs test** si votre app est en mode test (vous pourrez le publier plus tard)
9. Cliquez sur **Enregistrer et continuer**

### 1.3 Créer des identifiants OAuth 2.0

1. Dans le menu de gauche, allez dans **API et services** > **Identifiants**
2. Cliquez sur **Créer des identifiants** en haut
3. Sélectionnez **ID client OAuth 2.0**
4. Remplissez les informations :
   - **Type d'application** : Application Web
   - **Nom** : Un nom descriptif (ex: "Gestion Locative Web Client")
   - **Origines JavaScript autorisées** : Ajoutez vos URLs
     - Pour le développement local : `http://localhost:5173` (ou votre port)
     - Pour la production : votre domaine (ex: `https://votreapp.com`)
   - **URI de redirection autorisés** :
     - Ajoutez : `https://xojzkwibfoqdydpbhvaf.supabase.co/auth/v1/callback`
5. Cliquez sur **Créer**
6. Une fenêtre s'ouvre avec votre **ID client** et votre **Secret client**
7. **Copiez ces deux valeurs** (vous en aurez besoin pour Supabase)

### 1.4 Récupérer l'URL de votre projet Supabase

1. Allez sur le [tableau de bord Supabase](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Dans **Project Settings** > **API**, vous trouverez votre **Project URL**
4. Elle ressemble à : `https://abcdefghijklmnop.supabase.co`

## Étape 2 : Configuration dans Supabase

1. Connectez-vous au [tableau de bord Supabase](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Dans le menu de gauche, allez dans **Authentication** > **Providers**
4. Trouvez **Google** dans la liste et cliquez dessus
5. Activez le provider Google (toggle en haut à droite)
6. Remplissez les informations suivantes :
   - **Client ID** : L'ID client copié depuis Google Cloud Console
   - **Client Secret** : Le secret client copié depuis Google Cloud Console
7. Cliquez sur **Save**

## Étape 3 : Mettre à jour les URI de redirection dans Google Cloud

Si vous avez oublié d'ajouter l'URI de redirection Supabase ou si vous devez la modifier :

1. Retournez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Allez dans **API et services** > **Identifiants**
3. Cliquez sur votre ID client OAuth créé précédemment
4. Dans **URI de redirection autorisés**, vérifiez que vous avez bien :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   ```
5. Cliquez sur **Enregistrer**

## Étape 4 : Tester l'authentification

1. Lancez votre application en développement :
   ```bash
   npm run dev
   ```

2. Accédez à la page de connexion

3. Cliquez sur le bouton **Continuer avec Google** ou **S'inscrire avec Google**

4. Vous devriez être redirigé vers la page de sélection de compte Google

5. Sélectionnez ou connectez-vous avec un compte Google

6. Après authentification, vous serez redirigé vers votre application

## Gestion des profils utilisateurs

Lorsqu'un utilisateur s'inscrit avec Google, les données suivantes sont automatiquement récupérées :

- Email (vérifié par Google)
- Prénom (de `given_name`)
- Nom (de `family_name`)
- Photo de profil (URL dans `avatar_url`)

### Gestion dans votre application

Le hook `upsertProfileFromUser` dans `src/hooks/useAuth.tsx` gère automatiquement la création du profil utilisateur avec les informations Google.

Les métadonnées de l'utilisateur Google sont disponibles dans `user.user_metadata` :
```javascript
{
  avatar_url: "https://...",
  email: "user@gmail.com",
  email_verified: true,
  full_name: "John Doe",
  iss: "https://accounts.google.com",
  name: "John Doe",
  phone_verified: false,
  picture: "https://...",
  provider_id: "...",
  sub: "..."
}
```

## Publier votre application (passer en production)

Par défaut, votre écran de consentement OAuth est en mode **Test**. Pour permettre à tout le monde de se connecter :

1. Retournez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Allez dans **API et services** > **Écran de consentement OAuth**
3. Cliquez sur **Publier l'application**
4. Suivez les instructions pour publier votre application

**Note** : Si votre application n'utilise que les scopes de base (email et profile), la vérification Google n'est généralement pas nécessaire.

## Problèmes courants

### Le bouton Google ne fait rien

- Vérifiez que les origines JavaScript autorisées dans Google Cloud incluent votre domaine
- Vérifiez que l'URI de redirection correspond exactement à celle de Supabase

### Erreur "redirect_uri_mismatch"

- L'URI de redirection dans Google Cloud doit être **exactement** : `https://votre-projet.supabase.co/auth/v1/callback`
- Vérifiez qu'il n'y a pas d'espace ou de caractère en trop

### Erreur "access_denied" ou "Error 403: access_denied"

- Votre application est en mode Test et l'utilisateur n'est pas dans la liste des utilisateurs test
- Ajoutez l'utilisateur dans **Écran de consentement OAuth** > **Utilisateurs test**
- Ou publiez votre application

### L'utilisateur est redirigé mais pas connecté

- Vérifiez les logs dans Supabase : **Authentication** > **Logs**
- Vérifiez que le Client ID et Client Secret sont corrects
- Vérifiez la console développeur de votre navigateur

## URLs importantes

- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://app.supabase.com/)
- [Documentation Supabase - Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Documentation Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans Supabase : **Authentication** > **Logs**
2. Vérifiez la console développeur de votre navigateur (F12)
3. Vérifiez que tous les paramètres correspondent entre Google Cloud et Supabase
4. Consultez la documentation officielle Supabase



## code google format JSON 

```
{"web":{"client_id":"177962626207-8am6pqq0v570ve4ikb1o9gvl3pf18omj.apps.googleusercontent.com","project_id":"bailogenius","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_secret":"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","redirect_uris":["https://xojzkwibfoqdydpbhvaf.supabase.co/auth/v1/callback"],"javascript_origins":["http://localhost:5173"]}}
```