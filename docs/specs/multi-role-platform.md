# Multi-Role Platform Specification
## BailoGenius - Landlord, Tenant & Service Provider Platform

---

## 🎯 Vision

Créer une plateforme collaborative où propriétaires, locataires et prestataires peuvent interagir de manière fluide pour gérer les réclamations et la maintenance.

### Principe clé
- **Propriétaire** : Paie l'abonnement, voit tout, gère tout
- **Locataire** : Gratuit, crée des réclamations, suit leur progression
- **Prestataire** : Gratuit, reçoit des missions, communique avec proprio et locataire

---

## 👥 Rôles et Permissions

### 1. Landlord (Propriétaire)
**Accès :**
- Dashboard complet avec vue d'ensemble
- Gestion de tous les biens et baux
- Visualisation de toutes les réclamations
- Gestion des prestataires réguliers
- Comptabilité et rapports
- Paramètres et invitations

**Actions :**
- Créer/modifier des biens et baux
- Inviter locataires et prestataires
- Assigner des tickets aux prestataires
- Communiquer avec locataires et prestataires
- Valider/refuser des demandes
- Gérer la facturation

### 2. Tenant (Locataire)
**Accès :**
- Vue limitée au(x) bien(s) qu'il loue
- Ses réclamations uniquement
- Communication avec proprio et prestataires assignés
- Documents liés à son bail

**Actions :**
- Créer des réclamations/tickets
- Uploader des photos/documents
- Communiquer dans les tickets
- Voir la progression de ses demandes
- Consulter son bail et quittances

### 3. Service Provider (Prestataire)
**Accès :**
- Vue des tickets qui lui sont assignés
- Communication avec proprio et locataires concernés
- Ses missions et historique

**Actions :**
- Voir les détails des missions
- Communiquer dans les tickets
- Uploader photos/devis/factures
- Mettre à jour le statut des interventions
- Voir son planning

---

## 🗂️ Modifications de la Base de Données

### 📝 Tables à MODIFIER

#### 1. `profiles`
**Colonnes à ajouter :**
```sql
-- Nouveau système de rôles
role: 'landlord' | 'tenant' | 'service_provider' | 'admin'

-- Gestion des invitations
invited_by: string | null  -- user_id du propriétaire qui a invité
linked_to_landlord: string | null  -- user_id du proprio pour les tenants/providers
is_invited_user: boolean  -- true si invité (ne paie pas)
invitation_accepted_at: timestamp | null

-- Infos supplémentaires
company_name: string | null  -- pour les prestataires
specialty: string | null  -- spécialité du prestataire (plomberie, électricité, etc.)
```

**Modifier l'enum :**
```sql
ALTER TYPE user_role_enum ADD VALUE 'landlord';
ALTER TYPE user_role_enum ADD VALUE 'tenant';
ALTER TYPE user_role_enum ADD VALUE 'service_provider';
```

#### 2. `maintenance_tickets`
**Colonnes à ajouter :**
```sql
-- Traçabilité
created_by_role: 'landlord' | 'tenant' | 'service_provider'
tenant_id: string | null  -- Contact ID du locataire concerné
lease_id: string | null  -- Bail concerné

-- Visibilité et permissions
visibility: 'public' | 'landlord_only'  -- qui peut voir ce ticket
category: string | null  -- plomberie, électricité, chauffage, etc.

-- Statut enrichi
estimated_resolution_date: timestamp | null
last_update_by: string | null  -- user_id de la dernière personne qui a mis à jour
```

**Ajouter relation :**
```sql
-- Lien vers leases
FOREIGN KEY (lease_id) REFERENCES leases(id)
-- Lien vers tenant
FOREIGN KEY (tenant_id) REFERENCES contacts(id)
```

#### 3. `communication_logs`
**Colonnes à ajouter :**
```sql
ticket_id: string | null  -- Lier les communications aux tickets
sender_id: string | null  -- user_id de l'expéditeur
sender_role: 'landlord' | 'tenant' | 'service_provider'
context_type: 'ticket' | 'lease' | 'general'  -- contexte de la communication
```

### ➕ Tables à CRÉER

#### 1. `ticket_messages` (Nouveau)
**Description :** Messages dans les tickets pour conversations à 3
```typescript
{
  id: string (uuid, primary key)
  ticket_id: string (foreign key -> maintenance_tickets.id)
  sender_id: string (user_id de l'expéditeur)
  sender_role: 'landlord' | 'tenant' | 'service_provider'
  message: text
  message_type: 'text' | 'status_update' | 'assignment' | 'system'
  attachments: json | null  // URLs des fichiers joints
  read_by: json | null  // {user_id: timestamp} pour tracking lecture
  created_at: timestamp
  updated_at: timestamp
  edited: boolean
  deleted_at: timestamp | null  // soft delete
}

-- Index
CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender ON ticket_messages(sender_id);
```

#### 2. `ticket_participants` (Nouveau)
**Description :** Gestion des participants aux tickets
```typescript
{
  id: string (uuid, primary key)
  ticket_id: string (foreign key -> maintenance_tickets.id)
  user_id: string (user_id du participant)
  role: 'landlord' | 'tenant' | 'service_provider'
  joined_at: timestamp
  last_read_at: timestamp | null  // dernière lecture du ticket
  notifications_enabled: boolean
  can_edit: boolean  // permissions d'édition
  can_close: boolean  // permission de clôturer
}

-- Contrainte unique
UNIQUE(ticket_id, user_id)

-- Index
CREATE INDEX idx_ticket_participants_ticket ON ticket_participants(ticket_id);
CREATE INDEX idx_ticket_participants_user ON ticket_participants(user_id);
```

#### 3. `service_providers` (Nouveau)
**Description :** Informations détaillées sur les prestataires
```typescript
{
  id: string (uuid, primary key)
  user_id: string (foreign key -> profiles.user_id)
  landlord_id: string (foreign key -> profiles.user_id)  // proprio qui l'a ajouté
  company_name: string | null
  siret: string | null
  specialty: string[]  // ['plomberie', 'électricité']
  hourly_rate: number | null
  currency: string  // 'EUR'

  // Contact professionnel
  professional_email: string | null
  professional_phone: string | null
  address: string | null

  // Disponibilité
  available: boolean
  availability_schedule: json | null  // horaires de disponibilité

  // Stats
  total_interventions: number
  average_rating: number | null
  response_time_hours: number | null  // temps de réponse moyen

  // Infos administratives
  insurance_certificate_url: string | null
  insurance_expiry_date: date | null

  created_at: timestamp
  updated_at: timestamp
}

-- Index
CREATE INDEX idx_service_providers_user ON service_providers(user_id);
CREATE INDEX idx_service_providers_landlord ON service_providers(landlord_id);
```

#### 4. `user_invitations` (Nouveau)
**Description :** Gestion des invitations pour locataires et prestataires
```typescript
{
  id: string (uuid, primary key)
  email: string
  role: 'tenant' | 'service_provider'
  invited_by: string (foreign key -> profiles.user_id)

  // Contexte de l'invitation
  invitation_context: 'lease' | 'service_provider' | 'manual'
  lease_id: string | null  // si invité via un bail
  property_id: string | null  // si invité pour une propriété

  // Token et sécurité
  token: string (unique)
  expires_at: timestamp

  // Statut
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  accepted_at: timestamp | null
  user_id: string | null  // user_id une fois accepté

  // Message personnalisé
  custom_message: text | null

  created_at: timestamp
  updated_at: timestamp
}

-- Index
CREATE INDEX idx_invitations_email ON user_invitations(email);
CREATE INDEX idx_invitations_token ON user_invitations(token);
CREATE INDEX idx_invitations_invited_by ON user_invitations(invited_by);
```

#### 5. `notification_preferences` (Nouveau)
**Description :** Préférences de notifications par utilisateur
```typescript
{
  id: string (uuid, primary key)
  user_id: string (foreign key -> profiles.user_id, unique)

  // Canaux
  email_enabled: boolean
  sms_enabled: boolean
  push_enabled: boolean

  // Types de notifications par rôle
  // Pour landlord
  new_ticket_created: boolean
  ticket_updated: boolean
  ticket_message: boolean
  payment_received: boolean

  // Pour tenant
  ticket_status_changed: boolean
  landlord_reply: boolean
  provider_assigned: boolean

  // Pour service_provider
  new_assignment: boolean
  message_received: boolean

  created_at: timestamp
  updated_at: timestamp
}
```

#### 6. `ticket_status_history` (Nouveau)
**Description :** Historique des changements de statut des tickets
```typescript
{
  id: string (uuid, primary key)
  ticket_id: string (foreign key -> maintenance_tickets.id)
  previous_status: string
  new_status: string
  changed_by: string (user_id)
  changed_by_role: 'landlord' | 'tenant' | 'service_provider'
  comment: text | null
  created_at: timestamp
}

-- Index
CREATE INDEX idx_status_history_ticket ON ticket_status_history(ticket_id);
```

---

## 🚀 Roadmap d'Implémentation

### Phase 1 : Foundation (Semaines 1-2)
**Objectif :** Mettre en place le système de rôles et invitations

#### Sprint 1.1 - Database Migration
- [ ] Modifier l'enum `user_role_enum`
- [ ] Ajouter les colonnes à `profiles`
- [ ] Créer la table `user_invitations`
- [ ] Créer la table `notification_preferences`
- [ ] Créer des migrations Supabase
- [ ] Tester les migrations en local

#### Sprint 1.2 - Invitation System // la actuelement 
- [ ] Créer l'interface d'invitation (Settings > Users)
- [ ] Formulaire d'invitation avec sélection du rôle
- [ ] Génération de token sécurisé
- [ ] Envoi d'email d'invitation (template)
- [ ] Page d'acceptation d'invitation
- [ ] Création automatique du profil lors de l'acceptation
- [ ] Liaison invited_by / linked_to_landlord

#### Sprint 1.3 - Role-Based Access Control (RBAC)
- [ ] Créer des hooks pour vérifier les rôles (`useRole`, `usePermissions`)
- [ ] Créer des composants de protection par rôle (`<RequireRole />`)
- [ ] Middleware de vérification côté serveur
- [ ] RLS (Row Level Security) dans Supabase pour chaque table
- [ ] Tests unitaires des permissions

### Phase 2 : Ticket System Enhancement (Semaines 3-4)
**Objectif :** Améliorer le système de tickets pour supporter les 3 rôles

#### Sprint 2.1 - Database for Tickets
- [ ] Modifier la table `maintenance_tickets`
- [ ] Créer la table `ticket_messages`
- [ ] Créer la table `ticket_participants`
- [ ] Créer la table `ticket_status_history`
- [ ] Créer la table `service_providers`
- [ ] Migrations et seeds de test

#### Sprint 2.2 - Ticket Creation & Assignment
- [ ] Interface de création de ticket (tenant view)
- [ ] Sélection de la propriété/unité
- [ ] Upload de photos/documents
- [ ] Auto-création des participants (tenant + landlord)
- [ ] Interface d'assignation de prestataire (landlord)
- [ ] Notification au prestataire assigné

#### Sprint 2.3 - Conversation System
- [ ] Interface de chat temps réel dans les tickets
- [ ] Affichage des participants actifs
- [ ] Typing indicators
- [ ] Upload de fichiers dans les messages
- [ ] Marquage de lecture (read receipts)
- [ ] Système de notifications en temps réel (Supabase Realtime)

### Phase 3 : Role-Specific Dashboards (Semaines 5-6) lA 
**Objectif :** Créer les 3 interfaces utilisateur distinctes

#### Sprint 3.1 - Landlord Dashboard
- [ ] Dashboard actuel = Landlord dashboard
- [ ] Vue d'ensemble des tickets par statut
- [ ] Liste des locataires actifs
- [ ] Liste des prestataires
- [ ] Alertes prioritaires
- [ ] Statistiques de maintenance

#### Sprint 3.2 - Tenant Dashboard
- [ ] Nouvelle interface simplifiée pour locataires
- [ ] "My Home" - infos du bien loué
- [ ] "My Requests" - liste des tickets créés
- [ ] Bouton "New Request" bien visible
- [ ] Documents du bail
- [ ] Contact du propriétaire

#### Sprint 3.3 - Service Provider Dashboard
- [ ] Interface pour prestataires
- [ ] "My Missions" - tickets assignés
- [ ] Calendrier des interventions
- [ ] Formulaire de compte-rendu d'intervention
- [ ] Upload de devis/factures
- [ ] Statistiques personnelles

### Phase 4 : User Management (Semaine 7)
**Objectif :** Gestion complète des utilisateurs par le landlord

#### Sprint 4.1 - User Management Interface
- [ ] Page Settings > Users
- [ ] Liste de tous les utilisateurs (tenants + providers)
- [ ] Filtres par rôle et statut
- [ ] Bouton "Invite User"
- [ ] Actions : Voir détails, Désactiver, Supprimer

#### Sprint 4.2 - Tenant Management
- [ ] Lier un tenant à un bail lors de la création du bail
- [ ] Option "Invite Tenant" dans le formulaire de bail
- [ ] Auto-assignation du tenant au bail
- [ ] Vue des biens du tenant (landlord view)
- [ ] Historique des tickets du tenant

#### Sprint 4.3 - Service Provider Management
- [ ] Page dédiée aux prestataires
- [ ] Formulaire complet de création de prestataire
- [ ] Gestion des spécialités
- [ ] Tarifs et disponibilités
- [ ] Historique des interventions
- [ ] Évaluation/notation (futur)

### Phase 5 : Notifications & Communication (Semaine 8)
**Objectif :** Système de notifications robuste

#### Sprint 5.1 - Email System
- [ ] Templates d'emails pour chaque événement
- [ ] Invitation de tenant
- [ ] Invitation de prestataire
- [ ] Nouveau ticket créé
- [ ] Message reçu dans un ticket
- [ ] Changement de statut
- [ ] Assignation à un prestataire
- [ ] Personnalisation avec logo/couleurs

#### Sprint 5.2 - In-App Notifications
- [ ] Cloche de notifications dans la navbar
- [ ] Compteur de notifications non lues
- [ ] Liste des notifications avec filtres
- [ ] Marquage lu/non lu
- [ ] Lien direct vers le ticket concerné
- [ ] Notifications temps réel via Supabase

#### Sprint 5.3 - Notification Preferences
- [ ] Page de paramètres de notifications
- [ ] Choix des canaux (email, SMS, push)
- [ ] Choix des types d'événements
- [ ] Fréquence (immédiat, digest quotidien)
- [ ] Sauvegardes des préférences

### Phase 6 : Polish & Testing (Semaines 9-10)
**Objectif :** Finalisation et tests

#### Sprint 6.1 - UI/UX Polish
- [ ] Revue de toutes les interfaces
- [ ] Mobile responsive pour les 3 dashboards
- [ ] Animations et transitions
- [ ] États de chargement
- [ ] Messages d'erreur user-friendly
- [ ] Tooltips et aide contextuelle

#### Sprint 6.2 - Testing
- [ ] Tests E2E pour chaque rôle
  - [ ] Landlord flow complet
  - [ ] Tenant flow complet
  - [ ] Service provider flow complet
- [ ] Tests des permissions (RLS)
- [ ] Tests des notifications
- [ ] Tests de performance

#### Sprint 6.3 - Documentation
- [ ] Guide d'utilisation landlord
- [ ] Guide d'utilisation tenant
- [ ] Guide d'utilisation service provider
- [ ] FAQ
- [ ] Vidéos de démonstration
- [ ] Release notes

---

## 📋 User Stories Clés

### En tant que Landlord
1. Je veux inviter mes locataires par email pour qu'ils puissent créer des réclamations
2. Je veux ajouter mes prestataires réguliers pour les assigner rapidement
3. Je veux voir tous les tickets de tous mes biens sur un seul dashboard
4. Je veux assigner un prestataire à un ticket et que tout le monde puisse communiquer
5. Je veux que seul moi paie l'abonnement, pas mes locataires/prestataires

### En tant que Tenant
1. Je veux créer une réclamation facilement avec des photos
2. Je veux voir l'avancement de mes demandes en temps réel
3. Je veux communiquer avec mon proprio et le prestataire sur la même conversation
4. Je ne veux pas payer pour utiliser la plateforme
5. Je veux recevoir des notifications quand quelque chose bouge sur mes tickets

### En tant que Service Provider
1. Je veux voir toutes mes missions assignées
2. Je veux pouvoir communiquer avec le locataire et le proprio
3. Je veux uploader mes devis et factures directement
4. Je veux mettre à jour le statut de mes interventions
5. Je ne veux pas payer pour utiliser la plateforme

---

## 🔐 Sécurité et Permissions (RLS Policies)

### Profiles
```sql
-- Landlords peuvent voir leurs propres tenants/providers
CREATE POLICY "landlords_see_invited_users"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id OR
  linked_to_landlord = auth.uid()
);

-- Users peuvent voir leur propre profil
CREATE POLICY "users_see_own_profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);
```

### Maintenance Tickets
```sql
-- Landlords voient tous les tickets de leurs propriétés
CREATE POLICY "landlords_see_all_tickets"
ON maintenance_tickets FOR SELECT
USING (
  user_id = auth.uid()
);

-- Tenants voient leurs propres tickets
CREATE POLICY "tenants_see_own_tickets"
ON maintenance_tickets FOR SELECT
USING (
  tenant_id IN (
    SELECT contact_id FROM lease_tenants
    WHERE contact_id IN (
      SELECT id FROM contacts WHERE email = auth.email()
    )
  )
);

-- Service providers voient les tickets assignés
CREATE POLICY "providers_see_assigned_tickets"
ON maintenance_tickets FOR SELECT
USING (
  assigned_to = auth.uid()
);
```

### Ticket Messages
```sql
-- Participants peuvent voir les messages des tickets
CREATE POLICY "participants_see_messages"
ON ticket_messages FOR SELECT
USING (
  ticket_id IN (
    SELECT ticket_id FROM ticket_participants
    WHERE user_id = auth.uid()
  )
);

-- Participants peuvent créer des messages
CREATE POLICY "participants_create_messages"
ON ticket_messages FOR INSERT
WITH CHECK (
  ticket_id IN (
    SELECT ticket_id FROM ticket_participants
    WHERE user_id = auth.uid()
  )
);
```

---

## 💾 Exemples de Flux de Données

### Flux 1 : Création d'un ticket par un locataire
1. Tenant se connecte → role = 'tenant'
2. Dashboard Tenant → Bouton "New Request"
3. Formulaire : titre, description, catégorie, photos
4. Submit → Création dans `maintenance_tickets`
   - `created_by_role = 'tenant'`
   - `tenant_id = current_tenant_contact_id`
   - `property_id = tenant_property`
5. Auto-création dans `ticket_participants`
   - Participant 1 : tenant
   - Participant 2 : landlord (auto via property.user_id)
6. Envoi notification email au landlord
7. Redirection vers la page du ticket avec chat

### Flux 2 : Assignation d'un prestataire par le landlord
1. Landlord ouvre le ticket
2. Sélectionne "Assign Service Provider"
3. Liste déroulante de ses prestataires réguliers
4. Sélection du prestataire → Update `maintenance_tickets.assigned_to`
5. Création dans `ticket_participants` pour le prestataire
6. Création message système : "John Doe (plumber) has been assigned"
7. Envoi notification email au prestataire
8. Prestataire reçoit le ticket dans son dashboard

### Flux 3 : Conversation à 3
1. Tenant envoie message : "Quand pouvez-vous passer ?"
2. Création dans `ticket_messages` avec `sender_role = 'tenant'`
3. Realtime broadcast vers tous les `ticket_participants`
4. Landlord et Provider voient le message en temps réel
5. Provider répond : "Je peux venir demain à 14h"
6. Création dans `ticket_messages` avec `sender_role = 'service_provider'`
7. Tenant et Landlord reçoivent notification
8. Historique complet visible par les 3 parties

---

## 🎨 Recommandations UX

### Navigation Adaptative par Rôle
```
LANDLORD:
- Dashboard (vue d'ensemble)
- Properties
- Leases
- Tenants (nouveau)
- Service Providers (nouveau)
- Maintenance
- Accounting
- Settings

TENANT:
- My Home (infos bien + bail)
- My Requests (tickets)
- Documents
- Contact Landlord
- Settings

SERVICE PROVIDER:
- My Missions (tickets assignés)
- Calendar
- Documents (devis/factures)
- Settings
```

### Codes Couleur par Rôle
- **Landlord** : Bleu (couleur principale actuelle)
- **Tenant** : Vert (apaisant, confiance)
- **Service Provider** : Orange (action, énergie)

### Terminologie Adaptée
- Landlord : "Tickets", "Tenants", "Assign"
- Tenant : "Requests", "My Issues", "Report a problem"
- Service Provider : "Missions", "Interventions", "Assignments"

---

## 📊 Métriques de Succès

### KPIs Landlord
- Temps moyen de résolution des tickets
- Nombre de tickets ouverts/fermés
- Taux de satisfaction des locataires
- Nombre de prestataires actifs

### KPIs Tenant
- Temps de première réponse du landlord
- Nombre de tickets en attente
- Taux de résolution

### KPIs Service Provider
- Nombre d'interventions réalisées
- Note moyenne (futur)
- Temps de réponse moyen
- Taux de complétion

---

## ⚠️ Points d'Attention Technique

1. **Row Level Security (RLS)** : Crucial pour la sécurité multi-tenant
2. **Realtime Subscriptions** : Gérer proprement les abonnements Supabase
3. **Performance** : Index sur toutes les foreign keys et colonnes de recherche
4. **Storage Supabase** : Policies pour l'upload de fichiers par rôle
5. **Email Delivery** : Utiliser un service fiable (SendGrid, Resend)
6. **Mobile First** : Les tenants utiliseront surtout leur mobile
7. **Offline Support** : Gérer les cas où le réseau est faible
8. **Pagination** : Ne pas charger tous les messages d'un ticket d'un coup
9. **Rate Limiting** : Éviter le spam de messages
10. **Audit Log** : Tracer toutes les actions importantes (qui a fait quoi quand)

---

## 🔄 Évolutions Futures (Post-MVP)

1. **Système de notation** : Tenants notent les prestataires et vice-versa
2. **Calendrier partagé** : Prise de RDV pour interventions
3. **Devis en ligne** : Prestataires créent des devis directement dans la plateforme
4. **Validation de devis** : Landlord/Tenant valident les devis
5. **Paiement intégré** : Paiement du prestataire via la plateforme
6. **Marketplace de prestataires** : Trouver des prestataires au-delà de sa liste
7. **Tickets récurrents** : Maintenance préventive programmée
8. **AI Assistant** : Suggestion de prestataires selon le type de problème
9. **Multi-langue** : Support FR/EN/ES
10. **Mobile App Native** : React Native pour iOS/Android

---

## 📚 Ressources Techniques

### Stack Recommandée
- **Frontend** : React + TypeScript (existant)
- **Backend** : Supabase (existant)
- **Auth** : Supabase Auth avec RLS
- **Realtime** : Supabase Realtime
- **Storage** : Supabase Storage
- **Email** : Resend ou SendGrid
- **UI** : Shadcn/ui (existant)
- **State** : React Query (existant)

### Packages Utiles
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "react-query": "^3.x",
    "zustand": "^4.x", // State management léger
    "react-hook-form": "^7.x",
    "zod": "^3.x", // Validation
    "date-fns": "^2.x",
    "react-dropzone": "^14.x", // Upload fichiers
    "react-hot-toast": "^2.x", // Notifications
    "socket.io-client": "^4.x" // Alternative Realtime
  }
}
```

---

## ✅ Checklist Avant Production

### Sécurité
- [ ] RLS activé sur toutes les tables
- [ ] Policies testées pour chaque rôle
- [ ] Validation des inputs côté serveur
- [ ] Rate limiting en place
- [ ] HTTPS forcé
- [ ] CORS configuré correctement

### Performance
- [ ] Index sur toutes les foreign keys
- [ ] Lazy loading des images
- [ ] Code splitting
- [ ] CDN pour les assets
- [ ] Caching stratégique
- [ ] Compression des images

### UX
- [ ] Loading states partout
- [ ] Error boundaries
- [ ] Messages d'erreur clairs
- [ ] Mobile responsive testé
- [ ] Accessibilité (WCAG 2.1)
- [ ] Dark mode (optionnel)

### Légal
- [ ] CGU adaptées multi-rôles
- [ ] RGPD : Consentement cookies
- [ ] Mentions légales
- [ ] Politique de confidentialité
- [ ] Droit à l'oubli implémenté

---

**Date de création** : 2025-10-10
**Version** : 1.0
**Auteur** : Claude Code pour BailoGenius
**Prochaine révision** : Après Phase 1 (Semaine 2)
