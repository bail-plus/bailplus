# Changelog - Système d'Invitation

## [1.0.0] - 2025-10-11

### ✨ Fonctionnalités ajoutées

#### Création d'invitations
- Interface de création d'invitations dans Settings > Users
- Formulaire avec sélection du rôle (Locataire / Prestataire)
- Champ message personnalisé optionnel
- Génération automatique de token sécurisé
- Génération d'URL d'invitation unique
- Popup affichant le lien d'invitation après création
- Mode développement : affichage du lien au lieu d'envoi d'email

#### Gestion des invitations
- Tableau listant toutes les invitations avec:
  - Email de l'invité
  - Rôle (Locataire / Prestataire)
  - Statut (En attente / Acceptée / Expirée / Annulée)
  - Date de création
  - Date d'expiration ou d'acceptation
- Actions contextuelles selon le statut:
  - **En attente**: Copier le lien / Renvoyer / Annuler / Supprimer
  - **Acceptée**: Supprimer uniquement
  - **Expirée/Annulée**: Supprimer uniquement
- Badges visuels pour les statuts
- Copie du lien d'invitation dans le presse-papier

#### Acceptation d'invitations
- Page publique d'acceptation (`/accept-invitation`)
- Affichage des détails de l'invitation:
  - Email de l'invité
  - Rôle attribué
  - Message personnalisé du propriétaire
- Formulaire de création de compte:
  - Nom complet
  - Mot de passe (minimum 8 caractères)
  - Confirmation du mot de passe
- Validation des données du formulaire
- Création automatique du profil utilisateur
- Liaison automatique au propriétaire invitant
- Redirection vers le dashboard après succès

#### Gestion des accès
- Exemption d'abonnement pour les utilisateurs invités
- Les locataires et prestataires accèdent gratuitement à la plateforme
- Seuls les propriétaires nécessitent un abonnement actif
- Guard de sécurité `RequireSubscription` mis à jour

#### Backend
- Edge Function `send-invitation-email` pour l'envoi d'emails
- Mode développement avec URL de retour
- Support de Resend pour l'envoi d'emails en production
- Template d'email HTML professionnel

### 🔧 Améliorations techniques

#### Robustesse
- Système de retry pour la création de profil (max 5 tentatives)
- Création manuelle du profil en fallback si le trigger échoue
- Gestion des erreurs avec messages clairs pour l'utilisateur
- Validation des invitations (expiration, statut, unicité)
- Vérification de l'existence d'utilisateurs avant création

#### Base de données
- Table `user_invitations` avec tous les champs nécessaires
- Champs ajoutés à la table `profiles`:
  - `user_type` (LANDLORD / TENANT / SERVICE_PROVIDER)
  - `invited_by` (référence au propriétaire)
  - `linked_to_landlord` (liaison au propriétaire)
  - `is_invited_user` (flag utilisateur invité)
  - `invitation_accepted_at` (date d'acceptation)

#### Sécurité
- Tokens sécurisés générés avec crypto.randomBytes
- Expiration des invitations après 7 jours
- RLS policies pour protéger les données
- Validation côté serveur et côté client

### 🐛 Corrections de bugs

- **Profil non créé**: Ajout d'un système de retry avec fallback de création manuelle
- **Redirection paywall pour locataires**: Ajout d'une exception dans le guard pour les utilisateurs invités
- **Erreurs 406 RLS**: Documentation des policies nécessaires
- **Duplication d'informations**: Nettoyage de l'affichage des dates dans le tableau
- **Email déjà utilisé**: Vérifications multiples pour éviter les doublons

### 📝 Documentation

- Documentation technique complète (`systeme-invitation.md`)
- Architecture et flux de travail détaillés
- Guide de configuration et déploiement
- Guide de dépannage avec problèmes courants
- Exemples de policies RLS nécessaires
- Scénarios de tests complets

### 🧹 Nettoyage

- Suppression des logs de debug emoji dans le code
- Logs standards conservés pour les erreurs critiques
- Code commenté pour meilleure maintenabilité
- Gestion d'erreurs cohérente

### ⚡ Performance

- Chargement asynchrone des invitations
- Optimisation des requêtes Supabase
- Mise en cache du lien d'invitation après génération
- Timeout de sécurité sur le guard (10 secondes)

---

## Notes de version

### Configuration requise

**Variables d'environnement (Edge Function)**:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
APP_URL=http://localhost:8080
RESEND_API_KEY=re_xxxxx (optionnel en dev)
FROM_EMAIL=noreply@votredomaine.com (optionnel en dev)
ENVIRONMENT=development
```

**RLS Policies à créer**:
- Voir `docs/systeme-invitation.md` section "Gestion des erreurs et Edge Cases"

### Migration

Aucune migration de données requise pour cette version.

### Breaking Changes

Aucun breaking change dans cette version.

---

## À venir

### Version 1.1.0 (prévu)
- [ ] Invitations en masse (import CSV)
- [ ] Rappels automatiques pour invitations non acceptées
- [ ] Notification au landlord lors de l'acceptation
- [ ] Statistiques d'invitations dans le dashboard
- [ ] QR code pour invitations mobiles

### Version 1.2.0 (prévu)
- [ ] Templates d'emails personnalisables
- [ ] Support multi-langue des emails
- [ ] Onboarding guidé après acceptation
- [ ] Rate limiting sur les acceptations
- [ ] Logs d'audit des invitations

---

**Contributeurs**: Claude Code, Équipe BailoGenius
**Date de release**: 11 octobre 2025
