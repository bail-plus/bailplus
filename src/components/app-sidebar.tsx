import { useCallback, useMemo } from "react"
import {
  BarChart3,
  Calendar,
  Building2,
  UserCheck,
  Users,
  User,
  Wrench,
  Calculator,
  FileText,
  MessageCircle,
  TrendingUp,
  Settings,
  Target
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth, useSignOut } from "@/hooks/useAuth"
import { LogOut } from "lucide-react"
import { useNavigate } from "react-router-dom"

type UserType = 'LANDLORD' | 'TENANT' | 'SERVICE_PROVIDER'

interface NavigationItem {
  title: string
  url: string
  icon: any
  roles: UserType[] // Quels rôles peuvent voir cet item
}

const allItems: NavigationItem[] = [
  { title: "Accueil", url: "/app/dashboard", icon: BarChart3, roles: ['LANDLORD', 'TENANT', 'SERVICE_PROVIDER'] },
  { title: "Calendrier", url: "/app/calendar", icon: Calendar, roles: ['LANDLORD', 'SERVICE_PROVIDER'] },
  { title: "Mon Profil", url: "/app/provider-profile", icon: User, roles: ['SERVICE_PROVIDER'] },
  { title: "Parc", url: "/app/properties", icon: Building2, roles: ['LANDLORD'] },
  { title: "Baux", url: "/app/leases", icon: UserCheck, roles: ['LANDLORD'] },
  { title: "Garant", url: "/app/people", icon: Users, roles: ['LANDLORD'] },
  { title: "Prestataires", url: "/app/providers", icon: Wrench, roles: ['LANDLORD'] },
  { title: "Maintenance", url: "/app/maintenance", icon: Wrench, roles: ['LANDLORD', 'TENANT', 'SERVICE_PROVIDER'] },
  { title: "Comptabilité", url: "/app/accounting", icon: Calculator, roles: ['LANDLORD'] },
  { title: "Documents", url: "/app/documents", icon: FileText, roles: ['LANDLORD', 'TENANT', 'SERVICE_PROVIDER'] },
  { title: "Communications", url: "/app/communications", icon: MessageCircle, roles: ['LANDLORD', 'TENANT', 'SERVICE_PROVIDER'] },
  { title: "Rapports", url: "/app/reports", icon: TrendingUp, roles: ['LANDLORD'] },
  { title: "TRI (simulateur)", url: "/app/tools/tri", icon: Target, roles: ['LANDLORD'] },
  { title: "Paramètres", url: "/app/settings", icon: Settings, roles: ['LANDLORD'] },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const { user, profile } = useAuth();
  const { mutate: signOut } = useSignOut();
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  // Filtrer les items selon le rôle de l'utilisateur
  const userType = (profile?.user_type || 'LANDLORD') as UserType
  const items = useMemo(() => {
    return allItems.filter(item => item.roles.includes(userType))
  }, [userType])

  const isActive = useCallback((path: string) => {
    if (path === "/app/dashboard") {
      return currentPath === "/app/dashboard" || currentPath === "/app"
    }
    return currentPath.startsWith(path)
  }, [currentPath])

  const getNavClassName = useCallback((path: string) => {
    return isActive(path)
      ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm border-r-2 border-sidebar-primary"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
  }, [isActive])
  return (
    <Sidebar
      className={`
        ${collapsed ? "w-16" : "w-64"} 
        transition-all duration-300 ease-in-out
        border-r border-sidebar-border
        bg-sidebar
      `}
      collapsible="icon"
    >
      <SidebarContent className="p-0">
        {/* Logo Section */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">BailloGenius</h1>
                <p className="text-xs text-sidebar-foreground/60">Gestion locative</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1 p-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/app"}
                      className={`
                        ${getNavClassName(item.url)}
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200
                        group relative
                      `}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.title}</span>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          {item.title}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-sidebar-foreground">
                {(user?.user_metadata?.first_name?.charAt(0) ?? "").toUpperCase()}
                {(user?.user_metadata?.last_name?.charAt(0) ?? "").toUpperCase()}
              </span>
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">SCI Investissement</p>
              </div>
            )}

            {/* Bouton déconnexion */}
            <button
              onClick={() => signOut()}
              className={`
        inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm
        hover:bg-sidebar-accent/60 text-sidebar-foreground transition
        ${collapsed ? "px-2 py-2" : ""}
      `}
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed }
            </button>
          </div>
        </div>

      </SidebarContent>
    </Sidebar>
  )
}