import { useAuth } from "@/hooks/auth/useAuth"
import LandlordDashboard from "../dashboards/LandlordDashboard"
import TenantDashboard from "../dashboards/TenantDashboard"
import ProviderDashboard from "../dashboards/ProviderDashboard"

/**
 * Dashboard Router - Redirige vers le bon dashboard selon le rôle de l'utilisateur
 *
 * LANDLORD → LandlordDashboard (vue complète avec finances, biens, etc.)
 * TENANT → TenantDashboard (vue simplifiée : mon logement, mes demandes)
 * SERVICE_PROVIDER → ProviderDashboard (missions assignées, interventions)
 */
const Index = () => {
  const { profile, loading, initialized } = useAuth()

  // Attendre que l'utilisateur soit chargé
  if (!initialized || loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement de votre espace...</p>
          </div>
        </div>
      </div>
    )
  }

  // Si pas de profil, afficher un message d'erreur
  if (!profile) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Erreur de chargement du profil</p>
            <p className="text-sm text-muted-foreground mt-2">Veuillez rafraîchir la page</p>
          </div>
        </div>
      </div>
    )
  }

  // Router vers le bon dashboard selon le user_type
  const userType = profile.user_type

  switch (userType) {
    case 'TENANT':
      return <TenantDashboard />

    case 'SERVICE_PROVIDER':
      return <ProviderDashboard />

    case 'LANDLORD':
    default:
      // Par défaut, on affiche le dashboard propriétaire
      return <LandlordDashboard />
  }
}

export default Index
