export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bank_transactions: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          label: string
          match_score: number | null
          matched_expense_id: string | null
          matched_rent_invoice_id: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          label: string
          match_score?: number | null
          matched_expense_id?: string | null
          matched_rent_invoice_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          label?: string
          match_score?: number | null
          matched_expense_id?: string | null
          matched_rent_invoice_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_matched_expense_id_fkey"
            columns: ["matched_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_rent_invoice_id_fkey"
            columns: ["matched_rent_invoice_id"]
            isOneToOne: false
            referencedRelation: "rent_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_settings: {
        Row: {
          brand_name: string | null
          created_at: string
          entity_id: string
          footer_text: string | null
          from_email: string | null
          from_name: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          reply_to_email: string | null
          secondary_color: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          entity_id: string
          footer_text?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          reply_to_email?: string | null
          secondary_color?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          entity_id?: string
          footer_text?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          reply_to_email?: string | null
          secondary_color?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branding_settings_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: true
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branding_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          content: string
          context_type:
            | Database["public"]["Enums"]["communication_context_enum"]
            | null
          created_at: string
          id: string
          recipient_email: string | null
          recipient_id: string | null
          recipient_phone: string | null
          recipient_type: string
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["user_type_enum"] | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          ticket_id: string | null
        }
        Insert: {
          content: string
          context_type?:
            | Database["public"]["Enums"]["communication_context_enum"]
            | null
          created_at?: string
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_type: string
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["user_type_enum"] | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          ticket_id?: string | null
        }
        Update: {
          content?: string
          context_type?:
            | Database["public"]["Enums"]["communication_context_enum"]
            | null
          created_at?: string
          id?: string
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_phone?: string | null
          recipient_type?: string
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["user_type_enum"] | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "communication_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          subject: string | null
          type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          deductions: Json | null
          id: string
          lease_id: string
          receipt_pdf_url: string | null
          return_date: string | null
          returned_amount: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          deductions?: Json | null
          id?: string
          lease_id: string
          receipt_pdf_url?: string | null
          return_date?: string | null
          returned_amount?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deductions?: Json | null
          id?: string
          lease_id?: string
          receipt_pdf_url?: string | null
          return_date?: string | null
          returned_amount?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          lease_id: string | null
          mime_type: string | null
          name: string
          property_id: string | null
          ticket_id: string | null
          type: string
          updated_at: string
          uploaded_by: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          lease_id?: string | null
          mime_type?: string | null
          name: string
          property_id?: string | null
          ticket_id?: string | null
          type: string
          updated_at?: string
          uploaded_by?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          lease_id?: string | null
          mime_type?: string | null
          name?: string
          property_id?: string | null
          ticket_id?: string | null
          type?: string
          updated_at?: string
          uploaded_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          type: Database["public"]["Enums"]["entity_type_enum"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          type?: Database["public"]["Enums"]["entity_type_enum"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          type?: Database["public"]["Enums"]["entity_type_enum"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          attendees: string | null
          created_at: string
          description: string | null
          end_date: string | null
          end_time: string | null
          event_type: string
          id: string
          location: string | null
          property_id: string | null
          start_date: string
          start_time: string | null
          status: string | null
          tenant_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          attendees?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          location?: string | null
          property_id?: string | null
          start_date: string
          start_time?: string | null
          status?: string | null
          tenant_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          attendees?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string
          id?: string
          location?: string | null
          property_id?: string | null
          start_date?: string
          start_time?: string | null
          status?: string | null
          tenant_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          invoice_file_url: string | null
          property_id: string | null
          status: string | null
          unit_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          expense_date: string
          id?: string
          invoice_file_url?: string | null
          property_id?: string | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          invoice_file_url?: string | null
          property_id?: string | null
          status?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_guarantors: {
        Row: {
          created_at: string
          guarantor_contact_id: string | null
          id: number
          lease_id: string | null
          tenant_contact_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guarantor_contact_id?: string | null
          id?: number
          lease_id?: string | null
          tenant_contact_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guarantor_contact_id?: string | null
          id?: number
          lease_id?: string | null
          tenant_contact_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_guarantors_guarantor_contact_id_fkey"
            columns: ["guarantor_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_guarantors_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_guarantors_tenant_contact_id_fkey"
            columns: ["tenant_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_tenants: {
        Row: {
          contact_id: string | null
          created_at: string
          id: string
          lease_id: string | null
          role: Database["public"]["Enums"]["role_lease_tenants_enum"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          id?: string
          lease_id?: string | null
          role?: Database["public"]["Enums"]["role_lease_tenants_enum"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          id?: string
          lease_id?: string | null
          role?: Database["public"]["Enums"]["role_lease_tenants_enum"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_tenants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_tenants_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          charges_amount: number | null
          contract_type: string | null
          created_at: string
          deposit_amount: number | null
          end_date: string | null
          id: string
          rent_amount: number
          start_date: string
          status: string | null
          tenant_id: string
          unit_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          charges_amount?: number | null
          contract_type?: string | null
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          rent_amount: number
          start_date: string
          status?: string | null
          tenant_id: string
          unit_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          charges_amount?: number | null
          contract_type?: string | null
          created_at?: string
          deposit_amount?: number | null
          end_date?: string | null
          id?: string
          rent_amount?: number
          start_date?: string
          status?: string | null
          tenant_id?: string
          unit_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          created_by: string | null
          created_by_role: Database["public"]["Enums"]["user_type_enum"] | null
          description: string | null
          estimated_resolution_date: string | null
          id: string
          last_update_by: string | null
          lease_id: string | null
          priority:
            | Database["public"]["Enums"]["maintenance_tickets_priority_enum"]
            | null
          property_id: string
          status:
            | Database["public"]["Enums"]["maintenance_tickets_status_enum"]
            | null
          tenant_user_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
          user_id: string | null
          visibility:
            | Database["public"]["Enums"]["ticket_visibility_enum"]
            | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          created_by_role?: Database["public"]["Enums"]["user_type_enum"] | null
          description?: string | null
          estimated_resolution_date?: string | null
          id?: string
          last_update_by?: string | null
          lease_id?: string | null
          priority?:
            | Database["public"]["Enums"]["maintenance_tickets_priority_enum"]
            | null
          property_id: string
          status?:
            | Database["public"]["Enums"]["maintenance_tickets_status_enum"]
            | null
          tenant_user_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
          visibility?:
            | Database["public"]["Enums"]["ticket_visibility_enum"]
            | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          created_by_role?: Database["public"]["Enums"]["user_type_enum"] | null
          description?: string | null
          estimated_resolution_date?: string | null
          id?: string
          last_update_by?: string | null
          lease_id?: string | null
          priority?:
            | Database["public"]["Enums"]["maintenance_tickets_priority_enum"]
            | null
          property_id?: string
          status?:
            | Database["public"]["Enums"]["maintenance_tickets_status_enum"]
            | null
          tenant_user_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          user_id?: string | null
          visibility?:
            | Database["public"]["Enums"]["ticket_visibility_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_tenant_user_id_fkey"
            columns: ["tenant_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "maintenance_tickets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          frequency: Database["public"]["Enums"]["notification_frequency_enum"]
          id: string
          landlord_reply: boolean | null
          message_received: boolean | null
          new_assignment: boolean | null
          new_ticket_created: boolean | null
          payment_received: boolean | null
          provider_assigned: boolean | null
          push_enabled: boolean | null
          sms_enabled: boolean | null
          ticket_message: boolean | null
          ticket_status_changed: boolean | null
          ticket_updated: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          frequency?: Database["public"]["Enums"]["notification_frequency_enum"]
          id?: string
          landlord_reply?: boolean | null
          message_received?: boolean | null
          new_assignment?: boolean | null
          new_ticket_created?: boolean | null
          payment_received?: boolean | null
          provider_assigned?: boolean | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          ticket_message?: boolean | null
          ticket_status_changed?: boolean | null
          ticket_updated?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          frequency?: Database["public"]["Enums"]["notification_frequency_enum"]
          id?: string
          landlord_reply?: boolean | null
          message_received?: boolean | null
          new_assignment?: boolean | null
          new_ticket_created?: boolean | null
          payment_received?: boolean | null
          provider_assigned?: boolean | null
          push_enabled?: boolean | null
          sms_enabled?: boolean | null
          ticket_message?: boolean | null
          ticket_status_changed?: boolean | null
          ticket_updated?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          log_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          log_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          log_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "communication_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      offers: {
        Row: {
          description: string | null
          features: string | null
          id: string
          max_properties: string | null
          name: string | null
          period: Database["public"]["Enums"]["period_enum"] | null
          popular: boolean | null
          price: string | null
        }
        Insert: {
          description?: string | null
          features?: string | null
          id?: string
          max_properties?: string | null
          name?: string | null
          period?: Database["public"]["Enums"]["period_enum"] | null
          popular?: boolean | null
          price?: string | null
        }
        Update: {
          description?: string | null
          features?: string | null
          id?: string
          max_properties?: string | null
          name?: string | null
          period?: Database["public"]["Enums"]["period_enum"] | null
          popular?: boolean | null
          price?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          adress: string | null
          birthdate: string | null
          city: string | null
          company_name: string | null
          created_at: string
          current_period_end: string | null
          email: string | null
          entity_id: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender_enum"] | null
          id: string
          invitation_accepted_at: string | null
          invited_by: string | null
          is_invited_user: boolean | null
          last_name: string | null
          linked_to_landlord: string | null
          phone_number: string | null
          postal_code: number | null
          role: Database["public"]["Enums"]["user_role_enum"] | null
          specialty: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          trial_end_date: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type_enum"] | null
        }
        Insert: {
          adress?: string | null
          birthdate?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          entity_id?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          id?: string
          invitation_accepted_at?: string | null
          invited_by?: string | null
          is_invited_user?: boolean | null
          last_name?: string | null
          linked_to_landlord?: string | null
          phone_number?: string | null
          postal_code?: number | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          specialty?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type_enum"] | null
        }
        Update: {
          adress?: string | null
          birthdate?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          current_period_end?: string | null
          email?: string | null
          entity_id?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          id?: string
          invitation_accepted_at?: string | null
          invited_by?: string | null
          is_invited_user?: boolean | null
          last_name?: string | null
          linked_to_landlord?: string | null
          phone_number?: string | null
          postal_code?: number | null
          role?: Database["public"]["Enums"]["user_role_enum"] | null
          specialty?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          trial_end_date?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_linked_to_landlord_fkey"
            columns: ["linked_to_landlord"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          city: string | null
          created_at: string
          entity_id: string | null
          id: string
          name: string
          postal_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          name: string
          postal_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          provider_id: string | null
          rated_by: string | null
          rating: number | null
          ticket_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string | null
          rated_by?: string | null
          rating?: number | null
          ticket_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string | null
          rated_by?: string | null
          rating?: number | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "provider_ratings_ticket_id_fkey1"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_invoices: {
        Row: {
          charges_amount: number | null
          created_at: string
          due_date: string
          id: string
          lease_id: string
          paid_date: string | null
          pdf_url: string | null
          period_month: number
          period_year: number
          rent_amount: number
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          charges_amount?: number | null
          created_at?: string
          due_date: string
          id?: string
          lease_id: string
          paid_date?: string | null
          pdf_url?: string | null
          period_month: number
          period_year: number
          rent_amount: number
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          charges_amount?: number | null
          created_at?: string
          due_date?: string
          id?: string
          lease_id?: string
          paid_date?: string | null
          pdf_url?: string | null
          period_month?: number
          period_year?: number
          rent_amount?: number
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rent_invoices_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          address: string | null
          availability_schedule: Json | null
          available: boolean | null
          average_rating: number | null
          company_name: string | null
          created_at: string | null
          currency: string | null
          hourly_rate: number | null
          id: string
          insurance_certificate_url: string | null
          insurance_expiry_date: string | null
          landlord_id: string
          professional_email: string | null
          professional_phone: string | null
          response_time_hours: number | null
          siret: string | null
          specialty: string[] | null
          total_interventions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          availability_schedule?: Json | null
          available?: boolean | null
          average_rating?: number | null
          company_name?: string | null
          created_at?: string | null
          currency?: string | null
          hourly_rate?: number | null
          id?: string
          insurance_certificate_url?: string | null
          insurance_expiry_date?: string | null
          landlord_id: string
          professional_email?: string | null
          professional_phone?: string | null
          response_time_hours?: number | null
          siret?: string | null
          specialty?: string[] | null
          total_interventions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          availability_schedule?: Json | null
          available?: boolean | null
          average_rating?: number | null
          company_name?: string | null
          created_at?: string | null
          currency?: string | null
          hourly_rate?: number | null
          id?: string
          insurance_certificate_url?: string | null
          insurance_expiry_date?: string | null
          landlord_id?: string
          professional_email?: string | null
          professional_phone?: string | null
          response_time_hours?: number | null
          siret?: string | null
          specialty?: string[] | null
          total_interventions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_landlord_id_fkey"
            columns: ["landlord_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "service_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_start: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          deleted_at: string | null
          edited: boolean | null
          id: string
          message: string
          message_type: Database["public"]["Enums"]["message_type_enum"] | null
          read_by: Json | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_type_enum"]
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          edited?: boolean | null
          id?: string
          message: string
          message_type?: Database["public"]["Enums"]["message_type_enum"] | null
          read_by?: Json | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_type_enum"]
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          edited?: boolean | null
          id?: string
          message?: string
          message_type?: Database["public"]["Enums"]["message_type_enum"] | null
          read_by?: Json | null
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["user_type_enum"]
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_participants: {
        Row: {
          can_close: boolean | null
          can_edit: boolean | null
          id: string
          joined_at: string | null
          last_read_at: string | null
          notifications_enabled: boolean | null
          role: Database["public"]["Enums"]["user_type_enum"]
          ticket_id: string
          user_id: string
        }
        Insert: {
          can_close?: boolean | null
          can_edit?: boolean | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          notifications_enabled?: boolean | null
          role: Database["public"]["Enums"]["user_type_enum"]
          ticket_id: string
          user_id: string
        }
        Update: {
          can_close?: boolean | null
          can_edit?: boolean | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          notifications_enabled?: boolean | null
          role?: Database["public"]["Enums"]["user_type_enum"]
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_participants_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["user_type_enum"]
          comment: string | null
          created_at: string | null
          id: string
          new_status: string
          previous_status: string | null
          ticket_id: string
        }
        Insert: {
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["user_type_enum"]
          comment?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          previous_status?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string
          changed_by_role?: Database["public"]["Enums"]["user_type_enum"]
          comment?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          previous_status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          furnished: boolean | null
          id: string
          property_id: string
          surface: number | null
          type: string | null
          unit_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          furnished?: boolean | null
          id?: string
          property_id: string
          surface?: number | null
          type?: string | null
          unit_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          furnished?: boolean | null
          id?: string
          property_id?: string
          surface?: number | null
          type?: string | null
          unit_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          custom_message: string | null
          email: string
          expires_at: string
          first_name: string | null
          id: string
          invitation_context: Database["public"]["Enums"]["invitation_context_enum"]
          invited_by: string
          last_name: string | null
          lease_id: string | null
          property_id: string | null
          role: Database["public"]["Enums"]["user_type_enum"]
          status: Database["public"]["Enums"]["invitation_status_enum"] | null
          token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          custom_message?: string | null
          email: string
          expires_at: string
          first_name?: string | null
          id?: string
          invitation_context: Database["public"]["Enums"]["invitation_context_enum"]
          invited_by: string
          last_name?: string | null
          lease_id?: string | null
          property_id?: string | null
          role: Database["public"]["Enums"]["user_type_enum"]
          status?: Database["public"]["Enums"]["invitation_status_enum"] | null
          token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          custom_message?: string | null
          email?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          invitation_context?: Database["public"]["Enums"]["invitation_context_enum"]
          invited_by?: string
          last_name?: string | null
          lease_id?: string | null
          property_id?: string | null
          role?: Database["public"]["Enums"]["user_type_enum"]
          status?: Database["public"]["Enums"]["invitation_status_enum"] | null
          token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_invitations_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          completed_date: string | null
          contractor_name: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          scheduled_date: string | null
          status: Database["public"]["Enums"]["work_orders_satus_enum"] | null
          ticket_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          completed_date?: string | null
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["work_orders_satus_enum"] | null
          ticket_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          completed_date?: string | null
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["work_orders_satus_enum"] | null
          ticket_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_landlord: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_service_provider: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_tenant: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_ticket_participant: {
        Args: { p_ticket_id: string }
        Returns: boolean
      }
    }
    Enums: {
      communication_context_enum: "ticket" | "lease" | "general"
      entity_type_enum: "PERSONAL" | "SCI"
      gender_enum: "male" | "female" | "other"
      invitation_context_enum: "lease" | "service_provider" | "manual"
      invitation_status_enum: "pending" | "accepted" | "expired" | "cancelled"
      maintenance_tickets_priority_enum: "FAIBLE" | "MOYEN" | "ELEVE" | "URGENT"
      maintenance_tickets_status_enum:
        | "NOUVEAU"
        | "EN COURS"
        | "EN ATTENTE DE PIECE"
        | "TERMINE"
      message_type_enum: "text" | "status_update" | "assignment" | "system"
      notification_frequency_enum: "immediate" | "daily"
      period_enum: "/mois" | "/an"
      role_lease_tenants_enum: "tenant" | "co-tenant"
      ticket_visibility_enum: "public" | "landlord_only"
      user_role_enum: "admin" | "user" | "trial"
      user_type_enum: "LANDLORD" | "TENANT" | "SERVICE_PROVIDER"
      work_orders_satus_enum:
        | "EN ATTENTE"
        | "PLANIFIE"
        | "EN COURS"
        | "TERMINE"
        | "ANNULE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      communication_context_enum: ["ticket", "lease", "general"],
      entity_type_enum: ["PERSONAL", "SCI"],
      gender_enum: ["male", "female", "other"],
      invitation_context_enum: ["lease", "service_provider", "manual"],
      invitation_status_enum: ["pending", "accepted", "expired", "cancelled"],
      maintenance_tickets_priority_enum: ["FAIBLE", "MOYEN", "ELEVE", "URGENT"],
      maintenance_tickets_status_enum: [
        "NOUVEAU",
        "EN COURS",
        "EN ATTENTE DE PIECE",
        "TERMINE",
      ],
      message_type_enum: ["text", "status_update", "assignment", "system"],
      notification_frequency_enum: ["immediate", "daily"],
      period_enum: ["/mois", "/an"],
      role_lease_tenants_enum: ["tenant", "co-tenant"],
      ticket_visibility_enum: ["public", "landlord_only"],
      user_role_enum: ["admin", "user", "trial"],
      user_type_enum: ["LANDLORD", "TENANT", "SERVICE_PROVIDER"],
      work_orders_satus_enum: [
        "EN ATTENTE",
        "PLANIFIE",
        "EN COURS",
        "TERMINE",
        "ANNULE",
      ],
    },
  },
} as const
