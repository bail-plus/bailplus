import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Mail } from "lucide-react"
import { getChannelIcon, getChannelBadge, getStatusBadge, formatDate, getRecipientTypeLabel } from "@/lib/communication-utils"
import type { ContactWithLeaseInfo } from "@/hooks/useContacts"
import type { Tables } from "@/integrations/supabase/types"

type ProfileSummary = Pick<
  Tables<"profiles">,
  "user_id" | "first_name" | "last_name" | "email" | "phone_number" | "user_type"
>

interface MessagesTabProps {
  messages: any[]
  messageDirection: "sent" | "received"
  searchTerm: string
  channelFilter: string
  statusFilter: string
  currentUserId: string
  contactsById: Map<string, ContactWithLeaseInfo>
  contactsByUserId: Map<string, ContactWithLeaseInfo>
  profilesById: Map<string, ProfileSummary>
  onDirectionChange: (direction: "sent" | "received") => void
  onSearchChange: (term: string) => void
  onChannelFilterChange: (channel: string) => void
  onStatusFilterChange: (status: string) => void
  onMessageClick: (message: any) => void
}

export function MessagesTab({
  messages,
  messageDirection,
  searchTerm,
  channelFilter,
  statusFilter,
  currentUserId,
  contactsById,
  contactsByUserId,
  profilesById,
  onDirectionChange,
  onSearchChange,
  onChannelFilterChange,
  onStatusFilterChange,
  onMessageClick,
}: MessagesTabProps) {
  return (
    <div className="space-y-4">
      <Tabs value={messageDirection} onValueChange={(value) => onDirectionChange(value as "sent" | "received")}>
        <TabsList>
          <TabsTrigger value="sent">Envoyés</TabsTrigger>
          <TabsTrigger value="received">Reçus</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher un message..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={channelFilter} onValueChange={onChannelFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="DELIVERED">Livrés</SelectItem>
                <SelectItem value="SENT">Livrés</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="FAILED">Échecs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {messageDirection === "sent" ? "Messages envoyés" : "Messages reçus"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{messageDirection === "sent" ? "Destinataire" : "Expéditeur"}</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Sujet/Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>{messageDirection === "sent" ? "Envoyé le" : "Reçu le"}</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Aucun message trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages.map((message) => {
                      const contact = message.recipient_id
                        ? contactsById.get(message.recipient_id) || contactsByUserId.get(message.recipient_id)
                        : undefined
                      const profile =
                        (message.recipient_id ? profilesById.get(message.recipient_id) : undefined) ||
                        (contact?.user_id ? profilesById.get(contact.user_id) : undefined)

                      const profileName = profile
                        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
                        : ""
                      const contactName = contact
                        ? [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim()
                        : ""
                      const contactDetailCandidates = [
                        message.recipient_email,
                        message.recipient_phone,
                        profile?.email,
                        profile?.phone_number,
                        contact?.email,
                        contact?.phone,
                      ].filter((value): value is string => Boolean(value))
                      const uniqueDetails = Array.from(new Set(contactDetailCandidates))
                      const primaryRole = profile?.user_type || contact?.role || message.recipient_type || ""
                      const recipientLabel = primaryRole ? getRecipientTypeLabel(primaryRole) : ""
                      const displayName =
                        profileName ||
                        contactName ||
                        uniqueDetails[0] ||
                        recipientLabel ||
                        "—"
                      const detailValue = uniqueDetails.find(value => value !== displayName) || ""
                      const infoParts = [
                        recipientLabel && recipientLabel !== displayName ? recipientLabel : "",
                        detailValue,
                      ].filter(Boolean)
                      const secondaryInfo = infoParts.length > 0 ? Array.from(new Set(infoParts)).join(" • ") : ""
                      const selectedToValue = uniqueDetails[0] || "—"

                      const messageChannel = message.recipient_email ? "EMAIL" : "SMS"
                      const ChannelIcon = getChannelIcon(messageChannel)
                      const channelBadge = getChannelBadge(messageChannel)
                      const statusBadge = getStatusBadge(message.status || "pending")

                      return (
                        <TableRow
                          key={message.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{displayName}</div>
                              {secondaryInfo && (
                                <div className="text-xs text-muted-foreground">
                                  {secondaryInfo}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                              <Badge variant={channelBadge.variant} className="text-xs">
                                {channelBadge.label}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="max-w-xs">
                              {message.subject ? (
                                <div className="font-medium text-sm truncate">{message.subject}</div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {message.template_id ? "Auto" : "Manuel"}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <statusBadge.icon className="w-4 h-4" />
                              <Badge variant={statusBadge.variant} className="text-xs">
                                {statusBadge.label}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {message.sent_at ? formatDate(message.sent_at) : 'N/A'}
                            </span>
                          </TableCell>

                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1"
                              onClick={() => {
                                const channel = message.recipient_email ? 'EMAIL' : 'SMS'
                                onMessageClick({
                                  id: message.id,
                                  channel,
                                  toName: displayName,
                                  to: selectedToValue,
                                  sentAt: message.sent_at,
                                  subject: message.subject,
                                  body: message.content || '',
                                  status: (message.status || '').toString(),
                                })
                              }}
                            >
                              <Eye className="w-3 h-3" />
                              Voir
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  )
}
