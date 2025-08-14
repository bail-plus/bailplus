import { useState } from "react"
import { Check, ChevronDown, Building, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const entities = [
  {
    id: "personal",
    name: "Personnel",
    type: "PERSONAL" as const,
    icon: User,
    description: "Biens personnels"
  },
  {
    id: "sci-demo",
    name: "SCI Investissement",
    type: "SCI" as const,
    icon: Building,
    description: "3 biens • 2 locataires"
  },
  {
    id: "sci-paris",
    name: "SCI Paris Center",
    type: "SCI" as const,
    icon: Building,
    description: "1 bien • 1 locataire"
  }
]

export function EntitySelector() {
  const [selectedEntity, setSelectedEntity] = useState(entities[1])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="min-w-48 justify-between"
        >
          <div className="flex items-center gap-2">
            <selectedEntity.icon className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">{selectedEntity.name}</div>
              <div className="text-xs text-muted-foreground">{selectedEntity.description}</div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {entities.map((entity) => (
          <DropdownMenuItem
            key={entity.id}
            onClick={() => setSelectedEntity(entity)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <entity.icon className="w-4 h-4" />
                <div>
                  <div className="font-medium">{entity.name}</div>
                  <div className="text-xs text-muted-foreground">{entity.description}</div>
                </div>
              </div>
              {selectedEntity.id === entity.id && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}