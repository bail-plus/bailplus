import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { EntitySelector } from "@/components/entity-selector"
import { GlobalSearch } from "@/components/global-search"
import { CreateButton } from "@/components/create-button"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { useAuth, useSignOut } from "@/hooks/useAuth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EntityProvider } from "@/contexts/EntityContext"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, profile } = useAuth();
  const { mutate: signOut } = useSignOut();

  // Déterminer si l'utilisateur est un propriétaire (LANDLORD)
  const isLandlord = profile?.user_type === 'LANDLORD'

  // Debug log
  console.log('[LAYOUT] Profile:', profile);
  console.log('[LAYOUT] user_type:', profile?.user_type);
  console.log('[LAYOUT] isLandlord:', isLandlord);

  return (
    <EntityProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-surface">
          <AppSidebar />

          <div className="flex-1 flex flex-col">
            {/* Global Header */}
            <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
              <div className="flex items-center justify-between h-full px-6">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                  {/* EntitySelector uniquement pour les propriétaires */}
                  {isLandlord && <EntitySelector />}
                </div>

                <div className="flex items-center gap-4">
                  {/* GlobalSearch et CreateButton uniquement pour les propriétaires */}
                  {isLandlord && (
                    <>
                      <GlobalSearch />
                      <CreateButton />
                    </>
                  )}

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="hidden sm:inline text-sm">
                          {user?.user_metadata?.first_name || user?.email?.split('@')[0]}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="flex items-center gap-2 p-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {user?.user_metadata?.first_name && user?.user_metadata?.last_name
                              ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                              : user?.email?.split('@')[0]
                            }
                          </span>
                          <span className="text-xs text-muted-foreground">{user?.email}</span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </EntityProvider>
  )
}
