# Système d'invitation - Documentation

## Vue d'ensemble

Le système d'invitation permet aux propriétaires (landlords) d'inviter des locataires et prestataires de services à rejoindre la plateforme BailoGenius.

## Composants implémentés

### 1. Interface d'invitation (Settings > Users)

**Fichier:** `src/components/settings/InvitationManager.tsx`

L'interface permet de :
- Créer de nouvelles invitations avec sélection du rôle (Locataire ou Prestataire)
- Voir la liste de toutes les invitations envoyées
- Filtrer les invitations par statut (En attente, Acceptée, Expirée, Annulée)
- Renvoyer une invitation
- Annuler une invitation
- Ajouter un message personnalisé

**Intégration:** Le composant est intégré dans `src/pages/Settings.tsx` dans l'onglet "Utilisateurs".

### 2. Génération de token sécurisé

**Fichier:** `src/lib/invitation-token.ts`

- Génère des tokens aléatoires et sécurisés (32 caractères)
- Calcule automatiquement la date d'expiration (par défaut 7 jours)

### 3. Hook de gestion des invitations

**Fichier:** `src/hooks/useInvitations.tsx`

Fonctionnalités :
- `createInvitation()` - Crée une nouvelle invitation et envoie l'email
- `fetchInvitations()` - Récupère toutes les invitations du landlord
- `cancelInvitation()` - Annule une invitation
- `resendInvitation()` - Renvoie une invitation avec un nouveau token
- `getInvitationByToken()` - Récupère une invitation par son token
- `acceptInvitation()` - Accepte une invitation et crée le compte utilisateur

### 4. Template d'email d'invitation

**Fichiers:**
- `src/components/email/InvitationEmailTemplate.tsx` - Template React
- `supabase/functions/send-invitation-email/index.ts` - Edge Function

L'email contient :
- Nom de l'inviteur
- Rôle attribué (traduit en français)
- Message personnalisé (optionnel)
- Bouton d'acceptation avec lien unique
- Date d'expiration
- Lien de secours en texte brut

### 5. Page d'acceptation d'invitation

**Fichier:** `src/pages/AcceptInvitation.tsx`

**Route:** `/accept-invitation?token=XXX`

La page permet à l'invité de :
1. Voir les détails de l'invitation (email, rôle, message)
2. Créer son compte avec nom complet et mot de passe
3. Accepter automatiquement les conditions d'utilisation

Validations :
- Token valide et non expiré
- Mot de passe minimum 8 caractères
- Confirmation du mot de passe

### 6. Edge Function d'envoi d'email

**Fichier:** `supabase/functions/send-invitation-email/index.ts`

Configuration requise :
- `RESEND_API_KEY` - Clé API Resend pour l'envoi d'emails
- `APP_URL` - URL de l'application (pour générer le lien d'invitation)

La fonction :
1. Vérifie que l'utilisateur est bien l'inviteur
2. Génère l'URL d'invitation avec le token
3. Crée l'email HTML avec le template
4. Envoie l'email via l'API Resend

## Flux d'utilisation

### Côté Propriétaire (Inviteur)

1. Aller dans **Settings > Users**
2. Cliquer sur **"Inviter utilisateur"**
3. Remplir le formulaire :
   - Email de l'invité
   - Rôle (Locataire ou Prestataire)
   - Message personnalisé (optionnel)
4. Cliquer sur **"Envoyer l'invitation"**
5. L'invitation est créée en base et l'email est envoyé automatiquement

### Côté Invité

1. Recevoir l'email d'invitation
2. Cliquer sur le bouton **"Accepter l'invitation"**
3. Être redirigé vers `/accept-invitation?token=XXX`
4. Remplir le formulaire :
   - Nom complet
   - Mot de passe
   - Confirmation du mot de passe
5. Cliquer sur **"Accepter et créer mon compte"**
6. Le compte est créé automatiquement avec :
   - Le rôle spécifié
   - La liaison avec le propriétaire (`linked_to_landlord`)
   - Les métadonnées d'invitation (`invited_by`, `is_invited_user`)
7. Redirection automatique vers le dashboard

## Configuration requise

### Variables d'environnement

Pour que l'envoi d'emails fonctionne en production :

```bash
# Dans Supabase Dashboard > Settings > Edge Functions
RESEND_API_KEY=re_xxxxxxxxxxxxx
APP_URL=https://votre-domaine.com
```

### Déploiement de l'Edge Function

```bash
supabase functions deploy send-invitation-email
```

## Base de données

La table `user_invitations` stocke :
- `email` - Email de l'invité
- `role` - Rôle attribué (TENANT, SERVICE_PROVIDER)
- `invited_by` - ID du propriétaire inviteur
- `invitation_context` - Contexte (manual, lease_creation, etc.)
- `token` - Token unique sécurisé
- `expires_at` - Date d'expiration
- `status` - Statut (pending, accepted, cancelled, expired)
- `custom_message` - Message personnalisé
- `lease_id`, `property_id` - Contexte optionnel
- `accepted_at` - Date d'acceptation
- `user_id` - ID de l'utilisateur créé

## Sécurité

### Token
- Généré avec crypto.randomBytes() (32 bytes)
- Unique et non prédictible
- Expire après 7 jours par défaut

### Validation
- Vérification de l'existence de l'email avant création
- Vérification du statut et de l'expiration du token
- Seul l'inviteur peut envoyer/renvoyer l'email de son invitation

### RLS (Row Level Security)
Les policies Supabase doivent être configurées pour :
- Permettre aux landlords de créer/lire/modifier leurs propres invitations
- Permettre la lecture publique par token (pour l'acceptation)

## Tests recommandés

### Test du flux complet

1. **Créer une invitation**
   - Aller dans Settings > Users
   - Créer une invitation avec votre email de test
   - Vérifier que l'invitation apparaît dans la liste

2. **Consulter l'email**
   - Vérifier la réception de l'email
   - Vérifier que tous les éléments sont présents
   - Tester le lien d'acceptation

3. **Accepter l'invitation**
   - Cliquer sur le lien dans l'email
   - Remplir le formulaire de création de compte
   - Vérifier la redirection vers le dashboard

4. **Vérifier les données**
   - Vérifier que le profil est créé avec le bon rôle
   - Vérifier les liaisons (linked_to_landlord, invited_by)
   - Vérifier que l'invitation est marquée comme "accepted"

### Tests d'erreur

- Token invalide
- Token expiré
- Email déjà utilisé
- Invitation déjà acceptée
- Mot de passe trop court
- Mots de passe non correspondants

## Prochaines améliorations possibles

- [ ] Notifications en temps réel pour le landlord quand une invitation est acceptée
- [ ] Rappels automatiques pour les invitations non acceptées
- [ ] Interface de gestion des utilisateurs existants
- [ ] Personnalisation du template d'email
- [ ] Support multi-langue pour les emails
- [ ] Historique des actions sur les invitations
- [ ] Limite du nombre d'invitations par période
- [ ] Invitation en masse (CSV)

## Support

En cas de problème :
1. Vérifier les logs Supabase Edge Functions
2. Vérifier la configuration des variables d'environnement
3. Vérifier les policies RLS de la table user_invitations
4. Vérifier les logs d'envoi d'email dans Resend

## Fichiers modifiés/créés

### Nouveaux fichiers
- `src/components/settings/InvitationManager.tsx`
- `src/components/email/InvitationEmailTemplate.tsx`
- `src/hooks/useInvitations.tsx`
- `src/lib/invitation-token.ts`
- `src/pages/AcceptInvitation.tsx`
- `supabase/functions/send-invitation-email/index.ts`

### Fichiers modifiés
- `src/pages/Settings.tsx` - Intégration de InvitationManager
- `src/App.tsx` - Ajout de la route /accept-invitation
