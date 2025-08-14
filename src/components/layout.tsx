import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { EntitySelector } from "@/components/entity-selector"
import { GlobalSearch } from "@/components/global-search"
import { CreateButton } from "@/components/create-button"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-surface">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Global Header */}
          <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
                <EntitySelector />
              </div>
              
              <div className="flex items-center gap-4">
                <GlobalSearch />
                <CreateButton />
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
  )
}