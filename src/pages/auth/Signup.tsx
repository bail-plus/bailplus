import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth, useSignUp } from '@/hooks/auth/useAuth';
import { Link } from 'react-router-dom';
import { LoadingGate } from '@/components/layout/LoadingGate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Signup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') as 'LANDLORD' | 'SERVICE_PROVIDER' | null;
  const signUp = useSignUp();
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If no type specified, redirect to select-user-type
  if (!userType && !loading) {
    return <Navigate to="/select-user-type" replace />;
  }

  // If user is already authenticated, redirect to complete-profile with type
  if (user && !loading) {
    return <Navigate to={`/complete-profile?type=${userType}`} replace />;
  }

  // Set up auth state listener for immediate redirect after signup
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user });

      if (event === 'SIGNED_IN' && userType) {
        const user = session?.user;
        // Si l'email est déjà vérifié (rare), rediriger vers complete-profile
        if (user?.email_confirmed_at) {
          console.log('✅ Email déjà vérifié, redirecting to complete profile...');
          navigate(`/complete-profile?type=${userType}`);
        } else {
          console.log('📧 Email non vérifié, redirecting to verify-email...');
          navigate(`/verify-email?type=${userType}`);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, userType]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userType) {
      console.error('❌ No user type specified');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    // Vérifier que les mots de passe correspondent
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    // Vérifier si l'email existe déjà via RPC
    try {
      const { data: emailExists, error: checkError } = await supabase.rpc('check_email_exists', {
        email_to_check: email
      });

      if (checkError) {
        console.error('Erreur vérification email:', checkError);
        // Ne pas bloquer l'inscription si la vérification échoue
      } else if (emailExists) {
        toast.error('Cette adresse email est déjà utilisée');
        return;
      }
    } catch (err) {
      console.error('Exception vérification email:', err);
      // Continue quand même si erreur
    }

    signUp.mutate({
      email,
      password,
      firstName,
      lastName,
      user_type: userType,
    }, {
      onSuccess: async () => {
        console.log('✅ Signup successful');

        // Stocker l'email et le type d'utilisateur dans sessionStorage pour la page de vérification
        sessionStorage.setItem('pendingVerificationEmail', email);
        if (userType) {
          sessionStorage.setItem('pendingUserType', userType);
        }

        // Vérifier si l'utilisateur est connecté (email confirmé) ou non
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        console.log('🔍 [Signup] User après inscription:', {
          email: currentUser?.email,
          email_confirmed_at: currentUser?.email_confirmed_at,
          created_at: currentUser?.created_at,
          id: currentUser?.id
        });

        if (currentUser?.email_confirmed_at) {
          console.log('⚠️ [Signup] Email DÉJÀ confirmé ! email_confirmed_at =', currentUser.email_confirmed_at);
          console.log('⚠️ [Signup] Ceci est inhabituel pour une nouvelle inscription.');
          console.log('⚠️ [Signup] Vérifiez la config Supabase "Confirm email" dans Authentication → Settings');
          setIsWaitingForAuth(true);
        } else {
          console.log('📧 [Signup] Email NON confirmé, redirection vers verify-email...');
          // Rediriger immédiatement vers verify-email avec l'email encodé dans l'URL
          const encodedEmail = encodeURIComponent(email);
          navigate(`/verify-email?type=${userType}&email=${encodedEmail}`);
        }
      }
    });
  };

  if (loading || isWaitingForAuth) {
    return (
      <LoadingGate
        isLoading={true}
        message={isWaitingForAuth ? "Création de votre compte..." : "Chargement..."}
      >
        <div />
      </LoadingGate>
    );
  }

  const userTypeLabel = userType === 'LANDLORD' ? 'Propriétaire' : 'Prestataire';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Créer un compte {userTypeLabel}
          </h2>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Créez votre compte pour accéder à BailoGenius
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inscription</CardTitle>
            <CardDescription>
              Remplissez vos informations pour créer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    placeholder="Jean"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="jean.dupont@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Minimum 6 caractères"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Répétez votre mot de passe"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={signUp.isPending}
              >
                {signUp.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création du compte...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Vous avez déjà un compte ?{' '}
                <Link
                  to={`/auth${window.location.search}`}
                  className="text-primary hover:underline"
                >
                  Connectez-vous
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
