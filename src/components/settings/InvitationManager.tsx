import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInvitations, type Invitation } from '@/hooks/useInvitations';
import { generateInvitationUrl } from '@/lib/invitation-token';
import { Plus, Copy, RefreshCw, X, Loader2, CheckCircle2, Clock, XCircle, AlertCircle, Users, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function InvitationManager() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitationLinkDialogOpen, setInvitationLinkDialogOpen] = useState(false);
  const [createdInvitationUrl, setCreatedInvitationUrl] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'TENANT' | 'SERVICE_PROVIDER'>('TENANT');
  const [customMessage, setCustomMessage] = useState('');

  // Edit form state
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');

  const {
    loading,
    error,
    fetchInvitations,
    createInvitation,
    cancelInvitation,
    resendInvitation,
    deleteInvitedUser
  } = useInvitations();

  const { toast } = useToast();

  // Load invitations on mount
  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const data = await fetchInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('Failed to load invitations:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les invitations',
        variant: 'destructive',
      });
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!email) {
      toast({
        title: 'Erreur',
        description: 'L\'adresse email est requise',
        variant: 'destructive',
      });
      return;
    }

    if (!firstName || !lastName) {
      toast({
        title: 'Erreur',
        description: 'Le prénom et le nom sont requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      const invitation = await createInvitation({
        email,
        role,
        invitation_context: 'manual',
        custom_message: customMessage || undefined,
        first_name: firstName,
        last_name: lastName,
      });

      // Générer l'URL d'invitation
      const invitationUrl = generateInvitationUrl(invitation.token);

      // Afficher la modal avec le lien
      setCreatedInvitationUrl(invitationUrl);
      setInvitationLinkDialogOpen(true);

      // Afficher le toast
      toast({
        title: '✅ Invitation créée !',
        description: `Invitation envoyée à ${email}`,
      });

      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('TENANT');
      setCustomMessage('');
      setInviteDialogOpen(false);

      // Reload invitations
      loadInvitations();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de l\'invitation';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) {
      return;
    }

    try {
      await cancelInvitation(invitationId);
      toast({
        title: 'Invitation annulée',
        description: 'L\'invitation a été annulée avec succès',
      });
      loadInvitations();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler l\'invitation',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation(invitationId);
      toast({
        title: 'Invitation renvoyée',
        description: 'Un nouveau lien d\'invitation a été généré',
      });
      loadInvitations();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de renvoyer l\'invitation',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (invitation: Invitation) => {
    const userName = invitation.email;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userName} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await deleteInvitedUser(invitation.id, invitation.user_id);
      toast({
        title: 'Utilisateur supprimé',
        description: `${userName} a été supprimé avec succès`,
      });
      loadInvitations();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'utilisateur',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (invitation: Invitation) => {
    setEditingInvitation(invitation);
    setEditFirstName(invitation.first_name || '');
    setEditLastName(invitation.last_name || '');
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingInvitation || !editingInvitation.user_id) {
      toast({
        title: 'Erreur',
        description: 'Aucun utilisateur sélectionné',
        variant: 'destructive',
      });
      return;
    }

    if (!editFirstName || !editLastName) {
      toast({
        title: 'Erreur',
        description: 'Le prénom et le nom sont requis',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: editFirstName,
          last_name: editLastName,
        })
        .eq('user_id', editingInvitation.user_id);

      if (profileError) throw profileError;

      // Mettre à jour aussi l'invitation pour garder les données synchronisées
      const { error: invitationError } = await supabase
        .from('user_invitations')
        .update({
          first_name: editFirstName,
          last_name: editLastName,
        })
        .eq('id', editingInvitation.id);

      if (invitationError) throw invitationError;

      toast({
        title: 'Utilisateur mis à jour',
        description: 'Les informations ont été mises à jour avec succès',
      });

      setEditDialogOpen(false);
      setEditingInvitation(null);
      loadInvitations();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'utilisateur',
        variant: 'destructive',
      });
    }
  };

  const copyInvitationLink = (token: string) => {
    const url = generateInvitationUrl(token);
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copié',
      description: 'Le lien d\'invitation a été copié dans le presse-papier',
    });
  };

  const getStatusBadge = (invitation: Invitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (invitation.status === 'accepted') {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Acceptée
        </Badge>
      );
    }

    if (invitation.status === 'cancelled') {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="w-3 h-3" />
          Annulée
        </Badge>
      );
    }

    if (invitation.status === 'expired' || expiresAt < now) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Expirée
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="w-3 h-3" />
        En attente
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    return role === 'TENANT' ? (
      <Badge variant="default">Locataire</Badge>
    ) : (
      <Badge variant="secondary">Prestataire</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const canResendOrCancel = (invitation: Invitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    return invitation.status === 'pending' && expiresAt > now;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invitations</h3>
          <p className="text-sm text-muted-foreground">
            Invitez des locataires et prestataires à rejoindre votre plateforme
          </p>
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Inviter utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Inviter un utilisateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select value={role} onValueChange={(value: 'TENANT' | 'SERVICE_PROVIDER') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir le rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENANT">Locataire</SelectItem>
                    <SelectItem value="SERVICE_PROVIDER">Prestataire de services</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Les locataires peuvent créer des tickets. Les prestataires peuvent être assignés aux interventions.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-message">Message personnalisé (optionnel)</Label>
                <Textarea
                  id="custom-message"
                  placeholder="Ajoutez un message personnel à l'invitation..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateInvitation} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loadingInvitations ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Aucune invitation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Commencez par inviter vos locataires et prestataires
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                  <TableCell>{getStatusBadge(invitation)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(invitation.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {invitation.status === 'accepted' && invitation.accepted_at ? (
                      <span className="text-green-600 font-medium">
                        Acceptée le {formatDate(invitation.accepted_at)}
                      </span>
                    ) : (
                      <>Expire le {formatDate(invitation.expires_at)}</>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invitation.status === 'accepted' ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(invitation)}
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteUser(invitation)}
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : canResendOrCancel(invitation) ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyInvitationLink(invitation.token)}
                            title="Copier le lien"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResendInvitation(invitation.id)}
                            title="Renvoyer"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteUser(invitation)}
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteUser(invitation)}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal pour afficher le lien d'invitation */}
      <Dialog open={invitationLinkDialogOpen} onOpenChange={setInvitationLinkDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>🎉 Invitation créée avec succès !</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Copiez ce lien et envoyez-le à l'invité pour qu'il puisse créer son compte :
            </p>
            <div className="relative">
              <Input
                value={createdInvitationUrl}
                readOnly
                className="pr-20 font-mono text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                size="sm"
                className="absolute right-1 top-1"
                onClick={() => {
                  navigator.clipboard.writeText(createdInvitationUrl);
                  toast({
                    title: 'Copié !',
                    description: 'Le lien a été copié dans le presse-papier',
                  });
                }}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copier
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Conseil : Vous pouvez aussi copier ce lien depuis la liste des invitations en cliquant sur l'icône 📋
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setInvitationLinkDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour modifier un utilisateur */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editingInvitation?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">Prénom *</Label>
                <Input
                  id="editFirstName"
                  placeholder="Prénom"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editLastName">Nom *</Label>
                <Input
                  id="editLastName"
                  placeholder="Nom"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <Input
                value={editingInvitation?.role === 'TENANT' ? 'Locataire' : 'Prestataire de services'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateUser} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Mise à jour...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
