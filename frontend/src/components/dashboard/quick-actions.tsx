import { Building2, UserCheck, Calculator, FileText, Wrench, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const actions = [
  {
    title: "Créer un bien",
    description: "Ajouter une nouvelle propriété",
    icon: Building2,
    action: "create-property",
    color: "bg-blue-500"
  },
  {
    title: "Nouveau bail",
    description: "Gérer une nouvelle location",
    icon: UserCheck,
    action: "create-lease",
    color: "bg-green-500"
  },
  {
    title: "Générer quittance",
    description: "Créer une quittance de loyer",
    icon: Calculator,
    action: "create-receipt",
    color: "bg-purple-500"
  },
  {
    title: "Ajouter dépense",
    description: "Enregistrer une dépense",
    icon: FileText,
    action: "create-expense",
    color: "bg-orange-500"
  },
  {
    title: "Ticket maintenance",
    description: "Signaler un problème",
    icon: Wrench,
    action: "create-ticket",
    color: "bg-red-500"
  },
  {
    title: "Voir rapports",
    description: "Analyser les performances",
    icon: TrendingUp,
    action: "view-reports",
    color: "bg-indigo-500"
  }
]

export function QuickActions() {
  const handleAction = (action: string) => {
    console.log(`Quick action: ${action}`)
    // TODO: Implement navigation or modal opening
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.action}
            variant="outline"
            className="h-auto p-4 justify-start hover:shadow-md transition-all"
            onClick={() => handleAction(action.action)}
          >
            <div className={`p-2 rounded-lg mr-3 ${action.color}`}>
              <action.icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">{action.title}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}