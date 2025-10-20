import { useState, useEffect, useCallback } from "react"
import { Search, Building2, Users, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"

interface SearchItem {
  id: string
  title: string
  type: string
  icon: typeof Building2 | typeof Users | typeof FileText
}

interface SearchGroup {
  group: string
  items: SearchItem[]
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [searchData, setSearchData] = useState<SearchGroup[]>([])
  const [loading, setLoading] = useState(true)

  const loadSearchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load properties, profiles, and documents in parallel
      const [propertiesResult, profilesResult, documentsResult] = await Promise.all([
        supabase.from('properties').select('id, name, address'),
        supabase.from('profiles').select('id, first_name, last_name'),
        supabase.from('documents').select('id, name, type')
      ])

      const groups: SearchGroup[] = []

      // Properties
      if (propertiesResult.data && propertiesResult.data.length > 0) {
        groups.push({
          group: "Biens",
          items: propertiesResult.data.map(property => ({
            id: property.id,
            title: `${property.name} - ${property.address}`,
            type: "property",
            icon: Building2
          }))
        })
      }

      // Profiles
      if (profilesResult.data && profilesResult.data.length > 0) {
        groups.push({
          group: "Contacts",
          items: profilesResult.data.map(profile => ({
            id: profile.id,
            title: `${profile.first_name} ${profile.last_name}`,
            type: "profile",
            icon: Users
          }))
        })
      }

      // Documents
      if (documentsResult.data && documentsResult.data.length > 0) {
        groups.push({
          group: "Documents",
          items: documentsResult.data.map(document => ({
            id: document.id,
            title: document.name,
            type: "document",
            icon: FileText
          }))
        })
      }

      setSearchData(groups)
    } catch (error) {
      console.error('Error loading search data:', error)
      setSearchData([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSearchData()
  }, [loadSearchData])

  const filteredData = searchData.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.title.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(group => group.items.length > 0)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative w-64 justify-start text-muted-foreground"
      >
        <Search className="w-4 h-4 mr-2" />
        <span>Rechercher...</span>
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Rechercher des biens, locataires, documents..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          {filteredData.map((group, index) => (
            <div key={group.group}>
              <CommandGroup heading={group.group}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => {
                      console.log(`Navigate to ${item.type}:${item.id}`)
                      setOpen(false)
                    }}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {index < filteredData.length - 1 && <CommandSeparator />}
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}