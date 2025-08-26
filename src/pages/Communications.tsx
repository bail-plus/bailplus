import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageSquare, Plus, Search, Send, Eye, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface CommunicationLog {
  id: string
  recipient_type: string
  recipient_email: string | null
  recipient_phone: string | null
  subject: string | null
  content: string
  status: string | null
  sent_at: string | null
  template_id: string | null
}

interface CommunicationTemplate {
  id: string
  name: string
  type: string
  subject: string | null
  content: string
  variables: any
}

export default function Communications() {
  const [searchTerm, setSearchTerm] = useState("")
  const [channelFilter, setChannelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [messages, setMessages] = useState<CommunicationLog[]>([])
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const loadCommunicationData = useCallback(async () => {
    try {
      const [messagesResult, templatesResult] = await Promise.all([
        supabase.from('communication_logs').select('*').order('sent_at', { ascending: false }),
        supabase.from('communication_templates').select('*').order('created_at', { ascending: false })
      ])

      setMessages(messagesResult.data || [])
      setTemplates(templatesResult.data || [])
    } catch (error) {
      console.error('Error loading communication data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCommunicationData()
  }, [loadCommunicationData])

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      (message.recipient_email && message.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (message.subject && message.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    const messageChannel = message.recipient_email ? "EMAIL" : "SMS"
    const matchesChannel = channelFilter === "all" || messageChannel === channelFilter
    const matchesStatus = statusFilter === "all" || message.status === statusFilter
    
    return matchesSearch && matchesChannel && matchesStatus
  })

  const getChannelIcon = (channel: string) => {
    return channel === "EMAIL" ? Mail : MessageSquare
  }

  const getChannelBadge = (channel: string) => {
    const channels = {
      EMAIL: { label: "Email", variant: "default" as const },
      SMS: { label: "SMS", variant: "secondary" as const }
    }
    return channels[channel as keyof typeof channels] || { label: channel, variant: "secondary" as const }
  }

  const getStatusBadge = (status: string) => {
    const statuses = {
      PENDING: { label: "En attente", variant: "secondary" as const, icon: Clock },
      DELIVERED: { label: "Livré", variant: "default" as const, icon: CheckCircle },
      FAILED: { label: "Échec", variant: "destructive" as const, icon: AlertCircle }
    }
    return statuses[status as keyof typeof statuses] || { label: status, variant: "secondary" as const, icon: Clock }
  }

  const getMessageTypeBadge = (type: string) => {
    const types = {
      AUTO: { label: "Auto", variant: "outline" as const },
      MANUAL: { label: "Manuel", variant: "secondary" as const }
    }
    return types[type as keyof typeof types] || { label: type, variant: "secondary" as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate stats
  const totalMessages = messages.length
  const deliveredMessages = messages.filter(m => m.status === "sent").length
  const pendingMessages = messages.filter(m => m.status === "pending").length
  const emailMessages = messages.filter(m => m.recipient_email).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des communications...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
          <p className="text-muted-foreground mt-1">
            Envois d'emails et SMS, modèles et relances
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Envoyer un message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Canal</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destinataire</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir le destinataire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marie">Marie Dubois</SelectItem>
                      <SelectItem value="pierre">Pierre Martin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Modèle</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un modèle (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                  {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Sujet</label>
                <Input placeholder="Objet du message" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  placeholder="Votre message..."
                  rows={6}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button className="gap-2">
                  <Send className="w-4 h-4" />
                  Envoyer
                </Button>
                <Button variant="outline">
                  Aperçu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total envoyé</span>
            </div>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">messages</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Livrés</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{deliveredMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalMessages > 0 ? ((deliveredMessages / totalMessages) * 100).toFixed(0) : 0}% de succès
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">En attente</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{pendingMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">en cours</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Emails</span>
            </div>
            <div className="text-2xl font-bold">{emailMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              vs {totalMessages - emailMessages} SMS
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Journal des envois</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher un message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="DELIVERED">Livrés</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="FAILED">Échecs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Messages envoyés</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Sujet/Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Envoyé le</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        Aucun message trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMessages.map((message) => {
                      const messageChannel = message.recipient_email ? "EMAIL" : "SMS"
                      const ChannelIcon = getChannelIcon(messageChannel)
                      const channelBadge = getChannelBadge(messageChannel)
                      const statusBadge = getStatusBadge(message.status || "pending")
                      
                      return (
                        <TableRow 
                          key={message.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedMessage(message)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{message.recipient_type}</div>
                              <div className="text-xs text-muted-foreground">
                                {message.recipient_email || message.recipient_phone || 'N/A'}
                              </div>
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
                              {message.subject && (
                                <div className="font-medium text-sm truncate">{message.subject}</div>
                              )}
                              <div className="text-xs text-muted-foreground truncate">
                                {message.content}
                              </div>
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
                            <Button size="sm" variant="ghost" className="gap-1">
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
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Modèles de messages</h3>
              <p className="text-sm text-muted-foreground">
                Créez et gérez vos modèles d'emails et SMS
              </p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau modèle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un modèle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Fonctionnalité en cours de développement
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun modèle trouvé</p>
                <p className="text-xs mt-2">Créez votre premier modèle de message</p>
              </div>
            ) : (
              templates.map((template) => {
                const ChannelIcon = getChannelIcon(template.type)
                const channelBadge = getChannelBadge(template.type)
              
              return (
                <Card 
                  key={template.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{template.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <ChannelIcon className="w-4 h-4 text-muted-foreground" />
                        <Badge variant={channelBadge.variant} className="text-xs">
                          {channelBadge.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                        {template.subject && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Sujet</div>
                            <div className="text-sm truncate">{template.subject}</div>
                          </div>
                        )}
                        
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Contenu</div>
                          <div className="text-sm text-muted-foreground line-clamp-3">
                            {template.content}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                          <span>{template.variables ? JSON.parse(template.variables).length : 0} variable(s)</span>
                          <span>Modèle actif</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getChannelIcon(selectedMessage.channel)({className: "w-5 h-5"})}
                Message à {selectedMessage.toName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Canal:</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getChannelBadge(selectedMessage.channel).label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Statut:</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getStatusBadge(selectedMessage.status).label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Destinataire:</span> {selectedMessage.to}
                </div>
                <div>
                  <span className="font-medium">Envoyé le:</span> {formatDate(selectedMessage.sentAt)}
                </div>
              </div>
              
              {selectedMessage.subject && (
                <div>
                  <span className="font-medium text-sm">Sujet:</span>
                  <p className="mt-1 text-sm">{selectedMessage.subject}</p>
                </div>
              )}
              
              <div>
                <span className="font-medium text-sm">Message:</span>
                <div className="mt-1 p-3 bg-muted/20 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedMessage.body}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getChannelIcon(selectedTemplate.channel)({className: "w-5 h-5"})}
                {selectedTemplate.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Canal:</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getChannelBadge(selectedTemplate.channel).label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Utilisations:</span> {selectedTemplate.usage}
                </div>
              </div>
              
              {selectedTemplate.subject && (
                <div>
                  <span className="font-medium text-sm">Sujet:</span>
                  <p className="mt-1 text-sm">{selectedTemplate.subject}</p>
                </div>
              )}
              
              <div>
                <span className="font-medium text-sm">Contenu:</span>
                <div className="mt-1 p-3 bg-muted/20 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedTemplate.body}
                </div>
              </div>
              
              <div>
                <span className="font-medium text-sm">Variables disponibles:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedTemplate.variables.map((variable: string) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4 border-t">
                <Button size="sm">
                  Utiliser ce modèle
                </Button>
                <Button variant="outline" size="sm">
                  Modifier
                </Button>
                <Button variant="outline" size="sm">
                  Dupliquer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}