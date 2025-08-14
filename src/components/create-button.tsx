import { useState } from "react"
import { Plus, Building2, FileText, Calculator, Wrench, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const createItems = [
  { 
    label: "Nouveau bien", 
    icon: Building2, 
    action: "property",
    description: "Ajouter une propriété"
  },
  { 
    label: "Nouveau bail", 
    icon: FileText, 
    action: "lease",
    description: "Créer un contrat de location"
  },
  { 
    label: "Nouvelle quittance", 
    icon: Calculator, 
    action: "receipt",
    description: "Générer une quittance"
  },
  { 
    label: "Nouvelle dépense", 
    icon: Calculator, 
    action: "expense",
    description: "Enregistrer une dépense"
  },
  { 
    label: "Nouveau ticket", 
    icon: Wrench, 
    action: "ticket",
    description: "Signaler un problème"
  },
  { 
    label: "Nouvelle visite", 
    icon: Calendar, 
    action: "visit",
    description: "Programmer une visite"
  },
]

export function CreateButton() {
  const [open, setOpen] = useState(false)

  const handleItemClick = (action: string) => {
    console.log(`Create action: ${action}`)
    setOpen(false)
    // TODO: Implement navigation or modal opening
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className="bg-gradient-primary hover:opacity-90 border-0 shadow-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {createItems.map((item) => (
          <DropdownMenuItem 
            key={item.action}
            onClick={() => handleItemClick(item.action)}
            className="cursor-pointer"
          >
            <item.icon className="w-4 h-4 mr-3 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="font-medium">{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}