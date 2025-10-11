# Système d'Invitation - Documentation Technique

## Vue d'ensemble

Le système d'invitation permet aux propriétaires (landlords) d'inviter des **locataires** et des **prestataires de services** à rejoindre la plateforme BailoGenius.

Les utilisateurs invités bénéficient d'un accès gratuit à la plateforme sans nécessiter d'abonnement.

---

## Architecture

### Composants principaux

#### 1. Frontend

**Hook: `useInvitations.tsx`**
- Gestion complète du cycle de vie des invitations
- Fonctions principales:
  - `fetchInvitations()` - Récupère toutes les invitations du landlord
  - `createInvitation()` - Crée une nouvelle invitation
  - `cancelInvitation()` - Annule une invitation en attente
  - `resendInvitation()` - Génère un nouveau token et renvoie l'email
  - `getInvitationByToken()` - Récupère une invitation par son token
  - `acceptInvitation()` - Accepte une invitation et crée le compte utilisateur
  - `deleteInvitedUser()` - Supprime un utilisateur invité et son invitation

**Composant: `InvitationManager.tsx`**
- Interface de gestion des invitations dans Settings > Users
- Tableau avec toutes les invitations et leurs statuts
- Actions selon le statut:
  - **Acceptée**: Bouton Supprimer uniquement
  - **En attente**: Copier le lien / Renvoyer / Annuler / Supprimer
  - **Expirée/Annulée**: Bouton Supprimer uniquement

**Page: `AcceptInvitation.tsx`**
- Page publique d'acceptation d'invitation (`/accept-invitation?token=xxx`)
- Formulaire de création de compte avec:
  - Nom complet
  - Mot de passe (min. 8 caractères)
  - Confirmation du mot de passe
- Affiche les détails de l'invitation (email, rôle, message personnalisé)

**Guard: `RequireSubscription.tsx`**
- Vérifie si l'utilisateur a un accès valide à la plateforme
- **Exception importante**: Les utilisateurs avec `user_type` = `TENANT` ou `SERVICE_PROVIDER` sont exemptés de la vérification d'abonnement
- Seuls les landlords doivent avoir un abonnement actif

#### 2. Backend

**Edge Function: `send-invitation-email`**
- Localisation: `supabase/functions/send-invitation-email/`
- Responsabilités:
  - Récupère les détails de l'invitation depuis la base de données
  - Génère l'URL d'invitation avec le token
  - Envoie l'email via Resend (en production)
  - Mode développement: Retourne l'URL au lieu d'envoyer l'email

**Base de données: Table `user_invitations`**
```sql
Colonnes principales:
- id: uuid
- email: string
- role: user_type_enum ('TENANT' | 'SERVICE_PROVIDER')
- token: string (token sécurisé unique)
- status: invitation_status_enum ('pending' | 'accepted' | 'expired' | 'cancelled')
- invited_by: uuid (référence au landlord)
- expires_at: timestamp
- accepted_at: timestamp (nullable)
- user_id: uuid (nullable, rempli après acceptation)
- custom_message: text (nullable)
```

**Base de données: Table `profiles`**
```sql
Colonnes liées aux invitations:
- user_type: user_type_enum ('LANDLORD' | 'TENANT' | 'SERVICE_PROVIDER')
- invited_by: uuid (référence au landlord qui a invité)
- linked_to_landlord: uuid (même que invited_by)
- is_invited_user: boolean
- invitation_accepted_at: timestamp
```

---

## Flux de travail

### 1. Création d'une invitation

```
Landlord → InvitationManager → useInvitations.createInvitation()
    ↓
Validation (email unique, pas d'invitation en attente)
    ↓
Génération du token sécurisé
    ↓
Insertion dans user_invitations (status: 'pending')
    ↓
Appel Edge Function send-invitation-email
    ↓
Mode DEV: Affiche URL dans popup
Mode PROD: Envoie email via Resend
```

### 2. Acceptation d'une invitation

```
Invité clique sur lien → /accept-invitation?token=xxx
    ↓
useInvitations.getInvitationByToken()
    ↓
Validation (pending, non expirée)
    ↓
Formulaire de création de compte
    ↓
useInvitations.acceptInvitation(token, password)
    ↓
Création du compte Supabase Auth
    ↓
Attente de la création du profil (trigger + fallback manuel)
    ↓
Mise à jour du profil avec user_type, invited_by, etc.
    ↓
Mise à jour de l'invitation (status: 'accepted', user_id)
    ↓
Si SERVICE_PROVIDER: Création entrée dans service_providers
    ↓
Redirection vers /app/dashboard
```

### 3. Vérification d'accès

```
Utilisateur connecté → RequireSubscription guard
    ↓
Vérification: user_type === 'TENANT' || 'SERVICE_PROVIDER' ?
    ↓
OUI → Accès autorisé (pas besoin d'abonnement)
    ↓
NON → Vérification de l'abonnement (landlord)
```

---

## Gestion des erreurs et Edge Cases

### 1. Profil non créé par le trigger

**Problème**: Le trigger de création de profil peut échouer ou être lent.

**Solution**: La fonction `acceptInvitation()` implémente un système de retry:
1. Attend 1 seconde
2. Vérifie l'existence du profil toutes les 500ms (max 5 tentatives)
3. Si le profil n'existe pas après 3 secondes, le crée manuellement
4. Sinon, met à jour le profil existant

### 2. Invitations expirées

**Comportement**:
- Les invitations expirent après 7 jours (configurable)
- Le badge affiche "Expirée"
- Les boutons d'action sont désactivés sauf "Supprimer"
- L'acceptation est bloquée avec un message d'erreur

**Solution**: Utiliser "Renvoyer" pour générer un nouveau token avec nouvelle date d'expiration

### 3. Email déjà utilisé

**Vérifications en cascade**:
1. Vérification côté frontend avant création
2. Vérification dans la base de données (users existants)
3. Vérification des invitations en attente
4. Message d'erreur clair pour l'utilisateur

### 4. RLS Policies

**Problème courant**: Erreurs 406 lors de la création/mise à jour du profil

**Policies requises pour `profiles`**:
```sql
-- Lecture de son propre profil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Insertion de son propre profil
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mise à jour de son propre profil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);
```

**Policies requises pour `user_invitations`**:
```sql
-- Lecture publique par token (nécessaire pour la page d'acceptation)
CREATE POLICY "Anyone can read invitation by token" ON user_invitations
  FOR SELECT USING (true);

-- Mise à jour par l'utilisateur invité
CREATE POLICY "Users can update own invitation" ON user_invitations
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Création par les landlords
CREATE POLICY "Landlords can create invitations" ON user_invitations
  FOR INSERT WITH CHECK (auth.uid() = invited_by);
```

---

## Configuration

### Variables d'environnement (Edge Function)

```env
# .env pour Edge Function
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
APP_URL=http://localhost:8080  # ou https://votredomaine.com
RESEND_API_KEY=re_xxxxx  # Optionnel en dev
FROM_EMAIL=noreply@votredomaine.com  # Optionnel en dev
ENVIRONMENT=development  # ou production
```

### Mode développement vs Production

**Mode développement** (`ENVIRONMENT !== 'production'`):
- L'email n'est pas envoyé
- L'URL d'invitation est retournée dans la réponse
- Une popup affiche l'URL pour copier manuellement
- Utilise `onboarding@resend.dev` comme expéditeur

**Mode production**:
- L'email est envoyé via Resend
- Nécessite un domaine vérifié
- Utilise l'email FROM_EMAIL configuré

---

## Tests

### Scénario de test complet

1. **Créer une invitation**
   - Se connecter en tant que landlord
   - Aller dans Settings > Users
   - Cliquer sur "Inviter utilisateur"
   - Remplir email, choisir rôle (TENANT ou SERVICE_PROVIDER)
   - Ajouter un message personnalisé (optionnel)
   - Cliquer sur "Envoyer l'invitation"
   - Vérifier que la popup affiche l'URL

2. **Accepter l'invitation**
   - Ouvrir l'URL d'invitation dans un navigateur privé
   - Vérifier que les détails s'affichent correctement
   - Remplir le formulaire (nom, mot de passe)
   - Cliquer sur "Accepter et créer mon compte"
   - Vérifier la redirection vers /app/dashboard

3. **Vérifier l'accès**
   - Le locataire/prestataire doit accéder au dashboard
   - Pas de redirection vers /app/paywall
   - Les fonctionnalités appropriées doivent être accessibles

4. **Supprimer un utilisateur**
   - Retourner sur le compte landlord
   - Dans Settings > Users, trouver l'invitation acceptée
   - Cliquer sur le bouton "Supprimer"
   - Confirmer la suppression
   - Vérifier que l'utilisateur est supprimé de la liste

### Cas limites à tester

- [ ] Invitation avec email déjà utilisé
- [ ] Acceptation d'une invitation expirée
- [ ] Acceptation d'une invitation annulée
- [ ] Tentative d'acceptation deux fois de suite
- [ ] Mot de passe trop court (< 8 caractères)
- [ ] Mots de passe non identiques
- [ ] Copie du lien d'invitation
- [ ] Renvoi d'invitation
- [ ] Annulation d'invitation

---

## Maintenance et Evolution

### Points d'amélioration futurs

1. **Emails personnalisés**
   - Templates HTML améliorés
   - Support multi-langue
   - Logo et branding personnalisés

2. **Gestion avancée**
   - Invitations en masse (import CSV)
   - Rappels automatiques pour invitations non acceptées
   - Dashboard statistiques d'invitations

3. **Sécurité**
   - Rate limiting sur les acceptations
   - Logs d'audit des invitations
   - Notification au landlord lors de l'acceptation

4. **UX**
   - Preview de l'email d'invitation
   - QR code pour l'invitation mobile
   - Onboarding guidé après acceptation

### Monitoring

Logs à surveiller:
- Taux d'acceptation des invitations
- Temps moyen d'acceptation
- Invitations expirées non acceptées
- Erreurs lors de la création de profil

---

## Support et Dépannage

### Problèmes fréquents

**1. "Cette invitation a expiré"**
- Solution: Le landlord doit renvoyer l'invitation (génère un nouveau token)

**2. "Un compte existe déjà avec cet email"**
- Solution: L'utilisateur doit se connecter avec son compte existant

**3. Redirection vers paywall après acceptation**
- Vérifier que `user_type` est bien défini dans le profil
- Vérifier les logs de la console (`🔍 RequireSubscription Debug`)
- S'assurer que les RLS policies sont correctes

**4. Email non reçu (en production)**
- Vérifier que le domaine est vérifié dans Resend
- Vérifier les logs de l'Edge Function
- Vérifier que RESEND_API_KEY est défini

**5. Erreur 406 lors de l'acceptation**
- Problème de RLS policies sur la table `profiles`
- Ajouter la policy `Users can insert own profile`

---

## Références

### Fichiers clés

- `src/hooks/useInvitations.tsx` - Hook principal
- `src/components/settings/InvitationManager.tsx` - Interface de gestion
- `src/pages/AcceptInvitation.tsx` - Page d'acceptation
- `src/guards/RequireSubscription.tsx` - Guard d'accès
- `supabase/functions/send-invitation-email/index.ts` - Edge Function

### Tables Supabase

- `user_invitations` - Invitations
- `profiles` - Profils utilisateurs
- `service_providers` - Prestataires de services

### Librairies utilisées

- `@supabase/supabase-js` - Client Supabase
- `react-hook-form` - Gestion des formulaires (potentiel)
- `lucide-react` - Icônes
- `@/components/ui/*` - Composants UI (shadcn/ui)

---

**Dernière mise à jour**: Octobre 2025
**Version**: 1.0
**Auteur**: BailoGenius Team
