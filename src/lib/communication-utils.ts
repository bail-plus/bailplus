import { Mail, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react"
import type { ContactWithLeaseInfo } from "@/hooks/useContacts"
import type { Tables } from "@/integrations/supabase/types"

type ProfileSummary = Pick<
  Tables<"profiles">,
  "user_id" | "first_name" | "last_name" | "email" | "phone_number" | "user_type"
>

export function getChannelIcon(channel: string) {
  return channel === "EMAIL" ? Mail : MessageSquare
}

export function getChannelBadge(channel: string) {
  const channels = {
    EMAIL: { label: "Email", variant: "default" as const },
    SMS: { label: "SMS", variant: "secondary" as const }
  }
  return channels[channel as keyof typeof channels] || { label: channel, variant: "secondary" as const }
}

export function getStatusBadge(status: string) {
  const key = (status || '').toString().toUpperCase()
  const statuses = {
    PENDING: { label: "En attente", variant: "secondary" as const, icon: Clock },
    DELIVERED: { label: "Livré", variant: "default" as const, icon: CheckCircle },
    SENT: { label: "Livré", variant: "default" as const, icon: CheckCircle },
    FAILED: { label: "Échec", variant: "destructive" as const, icon: AlertCircle }
  }
  return (statuses as any)[key] || { label: status, variant: "secondary" as const, icon: Clock }
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getRecipientTypeLabel(type: string) {
  const types: Record<string, string> = {
    'tenant': 'Locataire',
    'guarantor': 'Garant',
    'both': 'Locataire/Garant',
    'TENANT': 'Locataire',
    'GUARANTOR': 'Garant',
    'LANDLORD': 'Propriétaire',
    'SERVICE_PROVIDER': 'Prestataire',
    'service_provider': 'Prestataire',
    'contractor': 'Prestataire',
    'CONTRACTOR': 'Prestataire',
    'other': 'Autre',
    'OTHER': 'Autre',
  }
  return types[type] || type
}

export function mapRecipientTypeForLog(
  profileType?: ProfileSummary["user_type"] | null,
  contactRole?: ContactWithLeaseInfo["role"] | string | null
): "tenant" | "contractor" | "other" {
  const normalizedRole = (contactRole || "").toString().toLowerCase()
  if (normalizedRole === "tenant" || normalizedRole === "both") return "tenant"
  if (normalizedRole === "guarantor") return "tenant"
  if (normalizedRole === "contractor" || normalizedRole === "service_provider") return "contractor"

  switch (profileType) {
    case "TENANT":
      return "tenant"
    case "SERVICE_PROVIDER":
      return "contractor"
    default:
      return "other"
  }
}

export function calculateCommunicationStats(messages: any[]) {
  const totalMessages = messages.length
  const deliveredMessages = messages.filter(m => (m.status || '').toLowerCase() === "sent").length
  const pendingMessages = messages.filter(m => (m.status || '').toLowerCase() === "pending").length
  const emailMessages = messages.filter(m => m.recipient_email).length

  return {
    totalMessages,
    deliveredMessages,
    pendingMessages,
    emailMessages,
    smsMessages: totalMessages - emailMessages,
  }
}
