import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useCommunicationLogs, useCommunicationTemplates } from "@/hooks/useCommunications"
import { useContactsWithLeaseInfo, type ContactWithLeaseInfo } from "@/hooks/useContacts"
import type { Tables } from "@/integrations/supabase/types"

type ProfileSummary = Pick<
  Tables<"profiles">,
  "user_id" | "first_name" | "last_name" | "email" | "phone_number" | "user_type"
>

export function useCommunicationData() {
  const [currentUserId, setCurrentUserId] = useState<string>("")

  // Fetch data
  const { data: messages = [], isLoading: messagesLoading } = useCommunicationLogs()
  const { data: templates = [], isLoading: templatesLoading } = useCommunicationTemplates()
  const { data: contacts = [] } = useContactsWithLeaseInfo()

  // Get current user ID
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    })()
  }, [])

  // Contacts maps
  const contactsById = useMemo(() => {
    const map = new Map<string, ContactWithLeaseInfo>()
    contacts.forEach(contact => map.set(contact.id, contact))
    return map
  }, [contacts])

  const contactsByUserId = useMemo(() => {
    const map = new Map<string, ContactWithLeaseInfo>()
    contacts.forEach(contact => {
      if (contact.user_id) map.set(contact.user_id, contact)
    })
    return map
  }, [contacts])

  // Available recipient profiles (for sending messages)
  const { data: availableRecipientProfiles = [], isLoading: availableProfilesLoading } = useQuery<ProfileSummary[]>({
    queryKey: ["available-recipient-profiles"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error("Non authentifié")

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, phone_number, user_type")
        .or(`linked_to_landlord.eq.${auth.user.id},user_id.eq.${auth.user.id}`)
        .order("first_name", { ascending: true, nullsFirst: false })
        .order("last_name", { ascending: true, nullsFirst: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as ProfileSummary[]
    },
    staleTime: 5 * 60 * 1000,
  })

  // Profile IDs from messages and contacts
  const profileUserIds = useMemo(() => {
    const ids = new Set<string>()
    messages.forEach(message => {
      if (message.recipient_id) ids.add(message.recipient_id)
    })
    contacts.forEach(contact => {
      if (contact.user_id) ids.add(contact.user_id)
    })
    return Array.from(ids).sort()
  }, [messages, contacts])

  // Recipient profiles (for displaying message recipients)
  const { data: recipientProfiles = [] } = useQuery<ProfileSummary[]>({
    queryKey: ["recipient-profiles", profileUserIds],
    enabled: profileUserIds.length > 0,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) throw new Error("Non authentifié")

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, email, phone_number, user_type")
        .in("user_id", profileUserIds)

      if (error) throw new Error(error.message)
      return (data ?? []) as ProfileSummary[]
    },
  })

  // Profiles map
  const profilesById = useMemo(() => {
    const map = new Map<string, ProfileSummary>()
    availableRecipientProfiles.forEach(profile => map.set(profile.user_id, profile))
    recipientProfiles.forEach(profile => map.set(profile.user_id, profile))
    return map
  }, [availableRecipientProfiles, recipientProfiles])

  return {
    messages,
    templates,
    contacts,
    currentUserId,
    contactsById,
    contactsByUserId,
    availableRecipientProfiles,
    availableProfilesLoading,
    profilesById,
    isLoading: messagesLoading || templatesLoading,
  }
}
