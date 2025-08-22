import { useState } from "react"
import { 
  BarChart3, 
  Calendar, 
  Building2, 
  UserCheck, 
  Users, 
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

const items = [
  { title: "Accueil", url: "/app", icon: BarChart3 },
  { title: "Calendrier", url: "/app/calendar", icon: Calendar },
  { title: "Parc", url: "/app/properties", icon: Building2 },
  { title: "Location", url: "/app/leasing", icon: UserCheck },
  { title: "Personnes", url: "/app/people", icon: Users },
  { title: "Maintenance", url: "/app/maintenance", icon: Wrench },
  { title: "Comptabilité", url: "/app/accounting", icon: Calculator },
  { title: "Documents", url: "/app/documents", icon: FileText },
  { title: "Communications", url: "/app/communications", icon: MessageCircle },
  { title: "Rapports", url: "/app/reports", icon: TrendingUp },
  { title: "TRI (simulateur)", url: "/app/tools/tri", icon: Target },
  { title: "Paramètres", url: "/app/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => {
    if (path === "/app") {
      return currentPath === "/app"
    }
    return currentPath.startsWith(path)
  }

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm border-r-2 border-sidebar-primary" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
  }

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
              <span className="text-xs font-medium text-sidebar-foreground">JD</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Jean Dupont</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">SCI Investissement</p>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}