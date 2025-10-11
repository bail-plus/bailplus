plateforme pour locataire : 
surface sur laquelle il peut faire des reclamation et voir la progression des reclamation ( plus dialogue avec le proprietaire )
aussi avec les prestataires reguliers de certaines location : 
dialogue avec eux, mission avec eux, conv a 3 avec le locataire le proprio et le presataire avec file chronologique pour voir la progression ( pour tt le monde ) 
plateforme proprio : 
on voit les reclamations, leurs progressions ( en lien avec la plateforme communication et maintenance ) 

📋 Modifications de la Base de Données - Liste Simple

  🎯 ÉTAPE 1 : CRÉER LES ENUMs (SQL Editor dans Supabase)

  ```sql
  -- 1. Type d'utilisateur (landlord/tenant/provider)
  CREATE TYPE user_type_enum AS ENUM (
    'landlord',
    'tenant',
    'service_provider'
  );

  -- 2. Visibilité des tickets
  CREATE TYPE ticket_visibility_enum AS ENUM (
    'public',
    'landlord_only'
  );

  -- 3. Type de message dans les tickets
  CREATE TYPE message_type_enum AS ENUM (
    'text',
    'status_update',
    'assignment',
    'system'
  );

  -- 4. Contexte de communication
  CREATE TYPE communication_context_enum AS ENUM (
    'ticket',
    'lease',
    'general'
  );

  -- 5. Statut d'invitation
  CREATE TYPE invitation_status_enum AS ENUM (
    'pending',
    'accepted',
    'expired',
    'cancelled'
  );

  -- 6. Contexte d'invitation
  CREATE TYPE invitation_context_enum AS ENUM (
    'lease',
    'service_provider',
    'manual'
  );
  ```

  ---
  🔧 ÉTAPE 2 : MODIFIER LES TABLES

  1. profiles

  Colonnes à AJOUTER :
  user_type: user_type_enum (nullable)
  invited_by: uuid (foreign key -> profiles.user_id, nullable)
  linked_to_landlord: uuid (foreign key -> profiles.user_id, nullable)
  is_invited_user: boolean (default: false)
  invitation_accepted_at: timestamptz (nullable)
  company_name: text (nullable, pour les prestataires)
  specialty: text[] (nullable, array pour les spécialités du prestataire)

  Note : J'utilise user_type au lieu de role car role existe déjà (admin/user/trial)

  ```sql
  -- Ajouter les colonnes à la table profiles
  ALTER TABLE profiles ADD COLUMN user_type user_type_enum;
  ALTER TABLE profiles ADD COLUMN invited_by UUID REFERENCES profiles(user_id);
  ALTER TABLE profiles ADD COLUMN linked_to_landlord UUID REFERENCES profiles(user_id);
  ALTER TABLE profiles ADD COLUMN is_invited_user BOOLEAN DEFAULT FALSE;
  ALTER TABLE profiles ADD COLUMN invitation_accepted_at TIMESTAMPTZ;
  ALTER TABLE profiles ADD COLUMN company_name TEXT;
  ALTER TABLE profiles ADD COLUMN specialty TEXT[];

  -- Index pour optimiser les recherches
  CREATE INDEX idx_profiles_user_type ON profiles(user_type);
  CREATE INDEX idx_profiles_invited_by ON profiles(invited_by);
  CREATE INDEX idx_profiles_linked_to_landlord ON profiles(linked_to_landlord);
  ```

  ---
  2. maintenance_tickets

  Colonnes à AJOUTER :
  created_by_role: user_type_enum (nullable)
  tenant_id: uuid (foreign key -> contacts.id, nullable)
  lease_id: uuid (foreign key -> leases.id, nullable)
  visibility: ticket_visibility_enum (default: 'public')
  category: text (nullable, ex: 'plomberie', 'électricité')
  estimated_resolution_date: timestamptz (nullable)
  last_update_by: uuid (nullable, user_id de la dernière personne)

  ```sql
  -- Ajouter les colonnes à la table maintenance_tickets
  ALTER TABLE maintenance_tickets ADD COLUMN created_by_role user_type_enum;
  ALTER TABLE maintenance_tickets ADD COLUMN tenant_id UUID REFERENCES contacts(id);
  ALTER TABLE maintenance_tickets ADD COLUMN lease_id UUID REFERENCES leases(id);
  ALTER TABLE maintenance_tickets ADD COLUMN visibility ticket_visibility_enum DEFAULT 'public';
  ALTER TABLE maintenance_tickets ADD COLUMN category TEXT;
  ALTER TABLE maintenance_tickets ADD COLUMN estimated_resolution_date TIMESTAMPTZ;
  ALTER TABLE maintenance_tickets ADD COLUMN last_update_by UUID;

  -- Index
  CREATE INDEX idx_tickets_created_by_role ON maintenance_tickets(created_by_role);
  CREATE INDEX idx_tickets_tenant ON maintenance_tickets(tenant_id);
  CREATE INDEX idx_tickets_lease ON maintenance_tickets(lease_id);
  CREATE INDEX idx_tickets_category ON maintenance_tickets(category);
  ```

  ---
  3. communication_logs

  Colonnes à AJOUTER :
  ticket_id: uuid (foreign key -> maintenance_tickets.id, nullable)
  sender_id: uuid (nullable)
  sender_role: user_type_enum (nullable)
  context_type: communication_context_enum (default: 'general')

  ```sql
  -- Ajouter les colonnes à la table communication_logs
  ALTER TABLE communication_logs ADD COLUMN ticket_id UUID REFERENCES maintenance_tickets(id);
  ALTER TABLE communication_logs ADD COLUMN sender_id UUID;
  ALTER TABLE communication_logs ADD COLUMN sender_role user_type_enum;
  ALTER TABLE communication_logs ADD COLUMN context_type communication_context_enum DEFAULT 'general';

  -- Index
  CREATE INDEX idx_comm_logs_ticket ON communication_logs(ticket_id);
  CREATE INDEX idx_comm_logs_sender ON communication_logs(sender_id);
  CREATE INDEX idx_comm_logs_context ON communication_logs(context_type);
  ```

  ---
  ➕ NOUVELLES TABLES À CRÉER

  4. ticket_messages

  id: uuid (primary key, default: gen_random_uuid())
  ticket_id: uuid (foreign key -> maintenance_tickets.id, NOT NULL)
  sender_id: uuid (NOT NULL)
  sender_role: user_type_enum (NOT NULL)
  message: text (NOT NULL)
  message_type: message_type_enum (default: 'text')
  attachments: jsonb (nullable, array d'URLs)
  read_by: jsonb (nullable, format: {"user_id": "timestamp"})
  created_at: timestamptz (default: now())
  updated_at: timestamptz (default: now())
  edited: boolean (default: false)
  deleted_at: timestamptz (nullable)

  ```sql
  -- Créer la table ticket_messages
  CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_role user_type_enum NOT NULL,
    message TEXT NOT NULL,
    message_type message_type_enum DEFAULT 'text',
    attachments JSONB,
    read_by JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    edited BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
  );

  -- Index
  CREATE INDEX idx_ticket_messages_ticket ON ticket_messages(ticket_id);
  CREATE INDEX idx_ticket_messages_sender ON ticket_messages(sender_id);
  CREATE INDEX idx_ticket_messages_created ON ticket_messages(created_at DESC);

  -- Enable RLS
  ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
  ```

  ---
  5. ticket_participants

  id: uuid (primary key, default: gen_random_uuid())
  ticket_id: uuid (foreign key -> maintenance_tickets.id, NOT NULL)
  user_id: uuid (NOT NULL)
  role: user_type_enum (NOT NULL)
  joined_at: timestamptz (default: now())
  last_read_at: timestamptz (nullable)
  notifications_enabled: boolean (default: true)
  can_edit: boolean (default: false)
  can_close: boolean (default: false)

  UNIQUE(ticket_id, user_id)

  ```sql
  -- Créer la table ticket_participants
  CREATE TABLE ticket_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role user_type_enum NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_close BOOLEAN DEFAULT FALSE,
    UNIQUE(ticket_id, user_id)
  );

  -- Index
  CREATE INDEX idx_ticket_participants_ticket ON ticket_participants(ticket_id);
  CREATE INDEX idx_ticket_participants_user ON ticket_participants(user_id);

  -- Enable RLS
  ALTER TABLE ticket_participants ENABLE ROW LEVEL SECURITY;
  ```

  ---
  6. service_providers

  id: uuid (primary key, default: gen_random_uuid())
  user_id: uuid (foreign key -> profiles.user_id, NOT NULL)
  landlord_id: uuid (foreign key -> profiles.user_id, NOT NULL)
  company_name: text (nullable)
  siret: text (nullable)
  specialty: text[] (default: '{}')
  hourly_rate: numeric(10,2) (nullable)
  currency: text (default: 'EUR')

  professional_email: text (nullable)
  professional_phone: text (nullable)
  address: text (nullable)

  available: boolean (default: true)
  availability_schedule: jsonb (nullable)

  total_interventions: integer (default: 0)
  average_rating: numeric(3,2) (nullable)
  response_time_hours: numeric(10,2) (nullable)

  insurance_certificate_url: text (nullable)
  insurance_expiry_date: date (nullable)

  created_at: timestamptz (default: now())
  updated_at: timestamptz (default: now())

  UNIQUE(user_id, landlord_id)

  ```sql
  -- Créer la table service_providers
  CREATE TABLE service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES profiles(user_id),
    company_name TEXT,
    siret TEXT,
    specialty TEXT[] DEFAULT '{}',
    hourly_rate NUMERIC(10,2),
    currency TEXT DEFAULT 'EUR',

    professional_email TEXT,
    professional_phone TEXT,
    address TEXT,

    available BOOLEAN DEFAULT TRUE,
    availability_schedule JSONB,

    total_interventions INTEGER DEFAULT 0,
    average_rating NUMERIC(3,2),
    response_time_hours NUMERIC(10,2),

    insurance_certificate_url TEXT,
    insurance_expiry_date DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, landlord_id)
  );

  -- Index
  CREATE INDEX idx_service_providers_user ON service_providers(user_id);
  CREATE INDEX idx_service_providers_landlord ON service_providers(landlord_id);
  CREATE INDEX idx_service_providers_specialty ON service_providers USING GIN(specialty);

  -- Enable RLS
  ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
  ```

  ---
  7. user_invitations

  id: uuid (primary key, default: gen_random_uuid())
  email: text (NOT NULL)
  role: user_type_enum (NOT NULL) -- Seulement 'tenant' ou 'service_provider'
  invited_by: uuid (foreign key -> profiles.user_id, NOT NULL)

  invitation_context: invitation_context_enum (NOT NULL)
  lease_id: uuid (foreign key -> leases.id, nullable)
  property_id: uuid (foreign key -> properties.id, nullable)

  token: text (UNIQUE, NOT NULL)
  expires_at: timestamptz (NOT NULL)

  status: invitation_status_enum (default: 'pending')
  accepted_at: timestamptz (nullable)
  user_id: uuid (foreign key -> profiles.user_id, nullable)

  custom_message: text (nullable)

  created_at: timestamptz (default: now())
  updated_at: timestamptz (default: now())

  ```sql
  -- Créer la table user_invitations
  CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role user_type_enum NOT NULL CHECK (role IN ('tenant', 'service_provider')),
    invited_by UUID NOT NULL REFERENCES profiles(user_id),

    invitation_context invitation_context_enum NOT NULL,
    lease_id UUID REFERENCES leases(id),
    property_id UUID REFERENCES properties(id),

    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,

    status invitation_status_enum DEFAULT 'pending',
    accepted_at TIMESTAMPTZ,
    user_id UUID REFERENCES profiles(user_id),

    custom_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Index
  CREATE INDEX idx_invitations_email ON user_invitations(email);
  CREATE INDEX idx_invitations_token ON user_invitations(token);
  CREATE INDEX idx_invitations_invited_by ON user_invitations(invited_by);
  CREATE INDEX idx_invitations_status ON user_invitations(status);

  -- Enable RLS
  ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
  ```

  ---
  8. notification_preferences

  id: uuid (primary key, default: gen_random_uuid())
  user_id: uuid (foreign key -> profiles.user_id, UNIQUE, NOT NULL)

  email_enabled: boolean (default: true)
  sms_enabled: boolean (default: false)
  push_enabled: boolean (default: true)

  new_ticket_created: boolean (default: true)
  ticket_updated: boolean (default: true)
  ticket_message: boolean (default: true)
  payment_received: boolean (default: true)
  ticket_status_changed: boolean (default: true)
  landlord_reply: boolean (default: true)
  provider_assigned: boolean (default: true)
  new_assignment: boolean (default: true)
  message_received: boolean (default: true)

  created_at: timestamptz (default: now())
  updated_at: timestamptz (default: now())

  ```sql
  -- Créer la table notification_preferences
  CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,

    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,

    new_ticket_created BOOLEAN DEFAULT TRUE,
    ticket_updated BOOLEAN DEFAULT TRUE,
    ticket_message BOOLEAN DEFAULT TRUE,
    payment_received BOOLEAN DEFAULT TRUE,
    ticket_status_changed BOOLEAN DEFAULT TRUE,
    landlord_reply BOOLEAN DEFAULT TRUE,
    provider_assigned BOOLEAN DEFAULT TRUE,
    new_assignment BOOLEAN DEFAULT TRUE,
    message_received BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Index
  CREATE INDEX idx_notif_prefs_user ON notification_preferences(user_id);

  -- Enable RLS
  ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
  ```

  ---
  9. ticket_status_history

  id: uuid (primary key, default: gen_random_uuid())
  ticket_id: uuid (foreign key -> maintenance_tickets.id, NOT NULL)
  previous_status: text (nullable)
  new_status: text (NOT NULL)
  changed_by: uuid (NOT NULL)
  changed_by_role: user_type_enum (NOT NULL)
  comment: text (nullable)
  created_at: timestamptz (default: now())

  ```sql
  -- Créer la table ticket_status_history
  CREATE TABLE ticket_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID NOT NULL,
    changed_by_role user_type_enum NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- Index
  CREATE INDEX idx_status_history_ticket ON ticket_status_history(ticket_id);
  CREATE INDEX idx_status_history_created ON ticket_status_history(created_at DESC);

  -- Enable RLS
  ALTER TABLE ticket_status_history ENABLE ROW LEVEL SECURITY;
  ```

  ---
  📊 RÉSUMÉ

  Tables modifiées : 3 (profiles, maintenance_tickets, communication_logs)

  Nouvelles tables : 6 (ticket_messages, ticket_participants, service_providers, user_invitations, notification_preferences, ticket_status_history)

  Colonnes ajoutées au total : 16

  Voilà ! Tu peux maintenant aller dans Supabase et faire ces modifications une par une. N'oublie pas d'activer le RLS (Row Level Security) sur les nouvelles tables
  après leur création.

─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
>  
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ? for shortcuts                                                                                                                      ⧉ In MULTI_ROLE_PLATFORM_SPEC.md
                                                                                         ✗ Auto-update failed · Try claude doctor or npm i -g @anthropic-ai/claude-code






