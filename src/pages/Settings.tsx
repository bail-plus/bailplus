import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Settings as SettingsIcon, Plus, Building, Users, CreditCard, FileText, Palette, Shield, Upload, Download, Loader2, Trash2, Bell } from "lucide-react"
import SubscriptionPanel from "@/components/dashboard/settings/payment/SubscriptionPanel"
import { InvitationManager } from "@/components/settings/InvitationManager"
import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"
import { useAuth } from "@/hooks/useAuth"

type EntityType = Database["public"]["Enums"]["entity_type_enum"]

interface Entity {
  id: string
  name: string
  type: EntityType
  description: string | null
  is_default: boolean
  properties_count: number
  active_leases_count: number
}

const MOCK_BANK_ACCOUNTS = [
  {
    id: "1",
    name: "Compte principal",
    iban: "FR76 **** **** **** ****1234",
    provider: "STUB",
    syncStatus: "connected",
    lastSync: "2024-01-15"
  }
]

export default function Settings() {
  const { profile } = useAuth()
  const userType = profile?.user_type

  // Définir les onglets disponibles par rôle
  const tabs = [
    { value: "organizations", label: "Entités", roles: ['LANDLORD'] },
    { value: "users", label: "Utilisateurs", roles: ['LANDLORD'] },
    { value: "banking", label: "Banques", roles: ['LANDLORD'] },
    { value: "templates", label: "Modèles", roles: ['LANDLORD'] },
    { value: "rent-rules", label: "Règles loyers", roles: ['LANDLORD'] },
    { value: "branding", label: "Branding", roles: ['LANDLORD'] },
    { value: "privacy", label: "RGPD", roles: ['LANDLORD', 'TENANT', 'SERVICE_PROVIDER'] },
    { value: "notifications", label: "Notifications", roles: ['LANDLORD', 'TENANT', 'SERVICE_PROVIDER'] },
  ]

  // Filtrer les onglets selon le rôle
  const visibleTabs = tabs.filter(tab => tab.roles.includes(userType || 'LANDLORD'))

  // Définir l'onglet actif par défaut selon le rôle
  const defaultTab = userType === 'SERVICE_PROVIDER' ? 'privacy' : 'organizations'
  const [activeTab, setActiveTab] = useState(defaultTab)

  const [entities, setEntities] = useState<Entity[]>([])
  const [loadingEntities, setLoadingEntities] = useState(true)
  const [newEntityOpen, setNewEntityOpen] = useState(false)
  const [newEntityName, setNewEntityName] = useState("")
  const [newEntityType, setNewEntityType] = useState<EntityType>("PERSONAL")
  const [newEntityDescription, setNewEntityDescription] = useState("")
  const [creating, setCreating] = useState(false)
  // Notification preferences state
  const [loadingPrefs, setLoadingPrefs] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [prefs, setPrefs] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: false,
    new_ticket_created: true,
    ticket_message: true,
    ticket_status_changed: true,
    provider_assigned: true,
    payment_received: false,
    frequency: 'immediate' as 'immediate' | 'daily',
  })

  const loadEntities = useCallback(async () => {
    try {
      setLoadingEntities(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: entitiesData, error } = await supabase
        .from('entities')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true })

      if (error) throw error

      // Pour chaque entité, compter les propriétés et baux actifs
      const enrichedEntities = await Promise.all(
        (entitiesData || []).map(async (entity) => {
          const { count: propertiesCount } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('entity_id', entity.id)

          const { data: properties } = await supabase
            .from('properties')
            .select('id')
            .eq('entity_id', entity.id)

          let activeLeasesCount = 0
          if (properties && properties.length > 0) {
            for (const property of properties) {
              const { data: units } = await supabase
                .from('units')
                .select('id')
                .eq('property_id', property.id)

              if (units && units.length > 0) {
                for (const unit of units) {
                  const { count } = await supabase
                    .from('leases')
                    .select('*', { count: 'exact', head: true })
                    .eq('unit_id', unit.id)
                    .eq('status', 'active')

                  activeLeasesCount += count || 0
                }
              }
            }
          }

          return {
            id: entity.id,
            name: entity.name,
            type: entity.type as EntityType,
            description: entity.description,
            is_default: entity.is_default || false,
            properties_count: propertiesCount || 0,
            active_leases_count: activeLeasesCount,
          }
        })
      )

      setEntities(enrichedEntities)
    } catch (error) {
      console.error('Error loading entities:', error)
    } finally {
      setLoadingEntities(false)
    }
  }, [])

  useEffect(() => {
    loadEntities()
  }, [loadEntities])

  // Load notification preferences
  useEffect(() => {
    (async () => {
      try {
        setLoadingPrefs(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (data) {
          setPrefs({
            email_enabled: !!data.email_enabled,
            sms_enabled: !!data.sms_enabled,
            push_enabled: !!data.push_enabled,
            new_ticket_created: !!data.new_ticket_created,
            ticket_message: !!data.ticket_message,
            ticket_status_changed: !!data.ticket_status_changed,
            provider_assigned: !!data.provider_assigned,
            payment_received: !!data.payment_received,
            frequency: (data as any).frequency || 'immediate',
          })
        } else {
          // initialize row with defaults
          await supabase.from('notification_preferences').insert({ user_id: user.id })
        }
      } catch (e) {
        console.error('[SETTINGS] load notification prefs error', e)
      } finally {
        setLoadingPrefs(false)
      }
    })()
  }, [])

  const saveNotificationPrefs = async () => {
    try {
      setSavingPrefs(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('notification_preferences')
        .update({
          email_enabled: prefs.email_enabled,
          sms_enabled: prefs.sms_enabled,
          push_enabled: prefs.push_enabled,
          new_ticket_created: prefs.new_ticket_created,
          ticket_message: prefs.ticket_message,
          ticket_status_changed: prefs.ticket_status_changed,
          provider_assigned: prefs.provider_assigned,
          payment_received: prefs.payment_received,
          frequency: prefs.frequency,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) throw error
      alert('Préférences enregistrées')
    } catch (e) {
      console.error('[SETTINGS] save notification prefs error', e)
      alert('Erreur lors de la sauvegarde des préférences')
    } finally {
      setSavingPrefs(false)
    }
  }

  const handleCreateEntity = async () => {
    if (!newEntityName.trim()) {
      alert('Le nom de l\'entité est requis')
      return
    }

    setCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('entities')
        .insert({
          name: newEntityName,
          type: newEntityType,
          description: newEntityDescription || null,
          user_id: user.id,
          is_default: entities.length === 0, // Première entité = par défaut
        })

      if (error) throw error

      alert('Entité créée avec succès !')
      setNewEntityOpen(false)
      setNewEntityName('')
      setNewEntityType('PERSONAL')
      setNewEntityDescription('')
      loadEntities()
    } catch (error) {
      console.error('Error creating entity:', error)
      alert('Erreur lors de la création de l\'entité')
    } finally {
      setCreating(false)
    }
  }

  const handleSetDefault = async (entityId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Désactiver tous les is_default
      await supabase
        .from('entities')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Activer celui sélectionné
      const { error } = await supabase
        .from('entities')
        .update({ is_default: true })
        .eq('id', entityId)

      if (error) throw error

      loadEntities()
    } catch (error) {
      console.error('Error setting default entity:', error)
      alert('Erreur lors de la définition de l\'entité par défaut')
    }
  }

  const handleDeleteEntity = async (entityId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entité ? Toutes les propriétés associées seront également supprimées.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('entities')
        .delete()
        .eq('id', entityId)

      if (error) throw error

      alert('Entité supprimée')
      loadEntities()
    } catch (error) {
      console.error('Error deleting entity:', error)
      alert('Erreur lors de la suppression de l\'entité')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground mt-1">
            Configuration de votre compte et de vos entités
          </p>
        </div>
      </div>

      {/* Main Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${
          visibleTabs.length === 2 ? 'grid-cols-2' :
          visibleTabs.length === 3 ? 'grid-cols-3' :
          visibleTabs.length === 4 ? 'grid-cols-4' :
          visibleTabs.length === 5 ? 'grid-cols-5' :
          visibleTabs.length === 6 ? 'grid-cols-6' :
          visibleTabs.length === 7 ? 'grid-cols-7' :
          'grid-cols-8'
        }`}>
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Organizations Tab */}
        {userType === 'LANDLORD' && (
        <TabsContent value="organizations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Organisations et entités</h3>
              <p className="text-sm text-muted-foreground">
                Gérez vos entités personnelles et SCI
              </p>
            </div>

            <Dialog open={newEntityOpen} onOpenChange={setNewEntityOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouvelle entité
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle entité</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity-name">Nom de l'entité</Label>
                    <Input
                      id="entity-name"
                      placeholder="Ex: SCI Investissement"
                      value={newEntityName}
                      onChange={(e) => setNewEntityName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entity-type">Type</Label>
                    <Select value={newEntityType} onValueChange={(value: EntityType) => setNewEntityType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONAL">Personnel</SelectItem>
                        <SelectItem value="SCI">SCI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entity-description">Description (optionnel)</Label>
                    <Input
                      id="entity-description"
                      placeholder="Ex: Biens personnels"
                      value={newEntityDescription}
                      onChange={(e) => setNewEntityDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateEntity} disabled={creating}>
                      {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {creating ? "Création..." : "Créer"}
                    </Button>
                    <Button variant="outline" onClick={() => setNewEntityOpen(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loadingEntities ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : entities.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Aucune entité</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre première entité pour commencer à gérer vos biens
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {entities.map((entity) => (
                <Card key={entity.id} className={entity.is_default ? "border-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {entity.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={entity.type === "PERSONAL" ? "default" : "secondary"} className="text-xs">
                          {entity.type === "PERSONAL" ? "Personnel" : "SCI"}
                        </Badge>
                        {entity.is_default && (
                          <Badge variant="outline" className="text-xs">
                            Par défaut
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {entity.description && (
                      <p className="text-sm text-muted-foreground mb-3">{entity.description}</p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Biens:</span>
                        <span className="font-medium">{entity.properties_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Baux actifs:</span>
                        <span className="font-medium">{entity.active_leases_count}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      {!entity.is_default && (
                        <Button size="sm" variant="outline" onClick={() => handleSetDefault(entity.id)}>
                          Définir par défaut
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteEntity(entity.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        )}

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Choisissez vos canaux et types d’événements à notifier.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Canaux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email</Label>
                  <p className="text-xs text-muted-foreground">Recevoir les notifications par email</p>
                </div>
                <Switch
                  checked={prefs.email_enabled}
                  onCheckedChange={(v) => setPrefs({ ...prefs, email_enabled: Boolean(v) })}
                  disabled={loadingPrefs}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS</Label>
                  <p className="text-xs text-muted-foreground">Recevoir des SMS (bientôt)</p>
                </div>
                <Switch
                  checked={prefs.sms_enabled}
                  onCheckedChange={(v) => setPrefs({ ...prefs, sms_enabled: Boolean(v) })}
                  disabled={loadingPrefs}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push</Label>
                  <p className="text-xs text-muted-foreground">Notifications push (bientôt)</p>
                </div>
                <Switch
                  checked={prefs.push_enabled}
                  onCheckedChange={(v) => setPrefs({ ...prefs, push_enabled: Boolean(v) })}
                  disabled={loadingPrefs}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Événements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Nouveau ticket</Label>
                  <p className="text-xs text-muted-foreground">Lorsqu’un ticket est créé</p>
                </div>
                <Switch
                  checked={prefs.new_ticket_created}
                  onCheckedChange={(v) => setPrefs({ ...prefs, new_ticket_created: Boolean(v) })}
                  disabled={loadingPrefs}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Message reçu</Label>
                  <p className="text-xs text-muted-foreground">Nouveau message dans un ticket</p>
                </div>
                <Switch
                  checked={prefs.ticket_message}
                  onCheckedChange={(v) => setPrefs({ ...prefs, ticket_message: Boolean(v) })}
                  disabled={loadingPrefs}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Changement de statut</Label>
                  <p className="text-xs text-muted-foreground">Le statut du ticket change</p>
                </div>
                <Switch
                  checked={prefs.ticket_status_changed}
                  onCheckedChange={(v) => setPrefs({ ...prefs, ticket_status_changed: Boolean(v) })}
                  disabled={loadingPrefs}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Assignation prestataire</Label>
                  <p className="text-xs text-muted-foreground">Un ticket vous est assigné (prestataire)</p>
                </div>
                <Switch
                  checked={prefs.provider_assigned}
                  onCheckedChange={(v) => setPrefs({ ...prefs, provider_assigned: Boolean(v) })}
                  disabled={loadingPrefs}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Paiement reçu</Label>
                  <p className="text-xs text-muted-foreground">Confirmation d’un paiement (landlord)</p>
                </div>
                <Switch
                  checked={prefs.payment_received}
                  onCheckedChange={(v) => setPrefs({ ...prefs, payment_received: Boolean(v) })}
                  disabled={loadingPrefs}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fréquence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Fréquence d'envoi des emails</Label>
                <Select value={prefs.frequency} onValueChange={(v: 'immediate' | 'daily') => setPrefs({ ...prefs, frequency: v })}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immédiat</SelectItem>
                    <SelectItem value="daily">Digest quotidien</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Immédiat: un email par événement. Digest: résumé quotidien (à implémenter).</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveNotificationPrefs} disabled={savingPrefs || loadingPrefs}>
              {savingPrefs && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {savingPrefs ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </TabsContent>

        {/* Users Tab */}
        {userType === 'LANDLORD' && (
        <TabsContent value="users" className="space-y-4">
          <InvitationManager />
        </TabsContent>
        )}

        {/* Banking Tab */}
        {userType === 'LANDLORD' && (
        <TabsContent value="banking" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Comptes bancaires</h3>
              <p className="text-sm text-muted-foreground">
                Connexion aux banques et agrégation
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Connecter un compte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connecter un compte bancaire</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    Intégration bancaire en mode STUB pour la démonstration
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>IBAN</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière synchro</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_BANK_ACCOUNTS.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{account.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{account.iban}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {account.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          Connecté
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(account.lastSync)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Synchroniser
                          </Button>
                          <Button size="sm" variant="ghost">
                            Configurer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Templates Tab */}
        {userType === 'LANDLORD' && (
        <TabsContent value="templates" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Modèles de documents</h3>
            <p className="text-sm text-muted-foreground">
              Personnalisez vos modèles PDF et emails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Modèles PDF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Bail de location
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Quittance de loyer
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    État des lieux
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Modèles emails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Envoi quittance
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Relance impayé
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Convocation visite
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Modèles SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    Rappel paiement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Confirmation RDV
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Intervention programmée
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        )}

        {/* Rent Rules Tab */}
        {userType === 'LANDLORD' && (
        <TabsContent value="rent-rules" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Règles de loyers</h3>
            <p className="text-sm text-muted-foreground">
              Configuration de l'IRL et de l'encadrement des loyers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Indexation IRL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="irl-base">Index IRL de référence</Label>
                  <Input
                    id="irl-base"
                    placeholder="Ex: 131.12"
                    defaultValue="131.12"
                  />
                  <p className="text-xs text-muted-foreground">
                    Index utilisé lors de la signature du bail
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="irl-current">Index IRL actuel</Label>
                  <Input
                    id="irl-current"
                    placeholder="Ex: 134.48"
                    defaultValue="134.48"
                  />
                  <p className="text-xs text-muted-foreground">
                    Dernier index publié par l'INSEE
                  </p>
                </div>

                <Button className="w-full">
                  Mettre à jour les indices
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Encadrement des loyers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rent-ref">Loyer de référence (€/m²)</Label>
                  <Input
                    id="rent-ref"
                    placeholder="Ex: 25.50"
                    defaultValue="25.50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent-major">Loyer majoré (+20%)</Label>
                  <Input
                    id="rent-major"
                    placeholder="Calculé automatiquement"
                    value="30.60"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent-minor">Loyer minoré (-30%)</Label>
                  <Input
                    id="rent-minor"
                    placeholder="Calculé automatiquement"
                    value="17.85"
                    disabled
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="rent-control" defaultChecked />
                  <Label htmlFor="rent-control" className="text-sm">
                    Vérifier l'encadrement lors de la création des baux
                  </Label>
                </div>

                <Button className="w-full">
                  Sauvegarder les règles
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        )}

        {/* Branding Tab */}
        {userType === 'LANDLORD' && (
        <TabsContent value="branding" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Branding et apparence</h3>
            <p className="text-sm text-muted-foreground">
              Personnalisez l'apparence de vos documents et emails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Logo et couleurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo de l'organisation</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Cliquez pour importer votre logo
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary-color">Couleur principale</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      defaultValue="#3b82f6"
                      className="w-20"
                    />
                    <Input
                      placeholder="#3b82f6"
                      defaultValue="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Couleur secondaire</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      defaultValue="#64748b"
                      className="w-20"
                    />
                    <Input
                      placeholder="#64748b"
                      defaultValue="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Nom de l'organisation</Label>
                  <Input
                    id="org-name"
                    defaultValue="Propriétaire Principal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-address">Adresse</Label>
                  <Textarea
                    id="org-address"
                    placeholder="Adresse complète..."
                    defaultValue="123 rue de la République&#10;75001 Paris"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-phone">Téléphone</Label>
                  <Input
                    id="org-phone"
                    placeholder="01 23 45 67 89"
                    defaultValue="01 23 45 67 89"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-email">Email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    defaultValue="proprietaire@example.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Numérotation automatique</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-format">Format des quittances</Label>
                  <Input
                    id="receipt-format"
                    placeholder="QUIT-YYYY-####"
                    defaultValue="QUIT-YYYY-####"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: QUIT-2024-0001
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lease-format">Format des baux</Label>
                  <Input
                    id="lease-format"
                    placeholder="BAIL-YYYY-####"
                    defaultValue="BAIL-YYYY-####"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: BAIL-2024-0001
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket-format">Format des tickets</Label>
                  <Input
                    id="ticket-format"
                    placeholder="TIC-YYYY-####"
                    defaultValue="TIC-YYYY-####"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: TIC-2024-0001
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">RGPD et confidentialité</h3>
            <p className="text-sm text-muted-foreground">
              Gestion des données personnelles et conformité RGPD
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Export des données
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Conformément au RGPD, vous pouvez demander l'export de toutes vos données personnelles.
                </p>

                <Button className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Télécharger mes données
                </Button>

                <p className="text-xs text-muted-foreground">
                  L'export inclura : profil, biens, locataires, communications, documents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Suppression du compte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  La suppression de votre compte effacera définitivement toutes vos données.
                </p>

                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive font-medium">
                    ⚠️ Cette action est irréversible
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">
                    Toutes vos données seront définitivement supprimées
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Supprimer mon compte
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer la suppression</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Cette action supprimera définitivement votre compte et toutes les données associées.
                      </p>
                      <div className="space-y-2">
                        <Label>Tapez "SUPPRIMER" pour confirmer</Label>
                        <Input placeholder="SUPPRIMER" />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="destructive">Confirmer la suppression</Button>
                        <Button variant="outline">Annuler</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Historique et abonnement - uniquement pour les propriétaires */}
          {userType === 'LANDLORD' && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historique des traitements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Création du compte</div>
                        <div className="text-xs text-muted-foreground">15/01/2024 à 14:30</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Accepté
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Ajout de locataires</div>
                        <div className="text-xs text-muted-foreground">15/01/2024 à 15:45</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Traité
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* payments */}
              <SubscriptionPanel />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
