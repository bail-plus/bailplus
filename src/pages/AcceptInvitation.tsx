import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInvitations, type Invitation } from '@/hooks/useInvitations';
import { Loader2, AlertCircle, CheckCircle2, Mail, User, Shield } from 'lucide-react';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { loading, error, getInvitationByToken, acceptInvitation } = useInvitations();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Charger l'invitation au montage
  useEffect(() => {
    if (!token) {
      setInvitationError('Token d\'invitation manquant');
      setLoadingInvitation(false);
      return;
    }

    const loadInvitation = async () => {
      try {
        const inv = await getInvitationByToken(token);

        if (!inv) {
          setInvitationError('Invitation non trouvée');
          return;
        }

        if (inv.status !== 'pending') {
          setInvitationError('Cette invitation n\'est plus valide');
          return;
        }

        if (new Date(inv.expires_at) < new Date()) {
          setInvitationError('Cette invitation a expiré');
          return;
        }

        setInvitation(inv);
      } catch (err) {
        console.error('Error loading invitation:', err);
        setInvitationError('Erreur lors du chargement de l\'invitation');
      } finally {
        setLoadingInvitation(false);
      }
    };

    loadInvitation();
  }, [token, getInvitationByToken]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setAcceptError(null);

    // Validation
    if (!fullName.trim()) {
      setAcceptError('Veuillez entrer votre nom complet');
      return;
    }

    if (password.length < 8) {
      setAcceptError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setAcceptError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setAcceptError('Token d\'invitation invalide');
      return;
    }

    setAccepting(true);

    try {
      await acceptInvitation(token, password);
      setSuccess(true);

      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'acceptation de l\'invitation';
      setAcceptError(message);
    } finally {
      setAccepting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      landlord: 'Propriétaire',
      tenant: 'Locataire',
      manager: 'Gestionnaire',
      viewer: 'Consultant',
      TENANT: 'Locataire',
      SERVICE_PROVIDER: 'Prestataire de services',
    };
    return roles[role] || role;
  };

  // État de chargement
  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Chargement de l'invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erreur d'invitation
  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-center">Invitation invalide</CardTitle>
            <CardDescription className="text-center">
              {invitationError || 'Impossible de charger l\'invitation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Succès
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">Invitation acceptée !</CardTitle>
            <CardDescription className="text-center">
              Votre compte a été créé avec succès. Vous allez être redirigé...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Formulaire d'acceptation
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">Bienvenue sur BailoGenius</CardTitle>
          <CardDescription className="text-center">
            Vous avez été invité à rejoindre la plateforme
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4 mb-6">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>Email:</strong> {invitation.email}
              </AlertDescription>
            </Alert>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Rôle:</strong> {getRoleLabel(invitation.role)}
              </AlertDescription>
            </Alert>

            {invitation.custom_message && (
              <Alert>
                <AlertDescription className="italic">
                  "{invitation.custom_message}"
                </AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <User className="w-4 h-4 inline mr-1" />
                Nom complet
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Votre nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={accepting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={accepting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Répétez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={accepting}
              />
            </div>

            {(acceptError || error) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{acceptError || error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={accepting}>
              {accepting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création du compte...
                </>
              ) : (
                'Accepter et créer mon compte'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              En acceptant cette invitation, vous acceptez les{' '}
              <a href="/terms" className="text-primary hover:underline">
                conditions d'utilisation
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
