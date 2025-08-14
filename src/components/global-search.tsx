import { useState } from "react"
import { Search, Building2, Users, FileText, Calculator } from "lucide-react"
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

const searchData = [
  {
    group: "Biens",
    items: [
      { id: "1", title: "Appartement 123 Rue de la Paix", type: "property", icon: Building2 },
      { id: "2", title: "Studio 45 Avenue des Champs", type: "property", icon: Building2 },
      { id: "3", title: "Maison 78 Boulevard Victor Hugo", type: "property", icon: Building2 },
    ]
  },
  {
    group: "Locataires",
    items: [
      { id: "4", title: "Marie Dupont", type: "tenant", icon: Users },
      { id: "5", title: "Pierre Martin", type: "tenant", icon: Users },
      { id: "6", title: "Sophie Dubois", type: "tenant", icon: Users },
    ]
  },
  {
    group: "Documents",
    items: [
      { id: "7", title: "Bail - Appartement 123 Rue de la Paix", type: "document", icon: FileText },
      { id: "8", title: "Quittance Février 2024", type: "document", icon: Calculator },
    ]
  }
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

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