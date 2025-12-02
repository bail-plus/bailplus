export function getPriorityBadge(priority: string | null) {
  const priorities = {
    URGENT: { label: "Urgente", variant: "destructive" as const },
    ELEVE: { label: "Élevée", variant: "destructive" as const },
    MOYEN: { label: "Moyenne", variant: "default" as const },
    FAIBLE: { label: "Faible", variant: "secondary" as const }
  }
  return priorities[priority as keyof typeof priorities] || { label: priority || "Moyenne", variant: "secondary" as const }
}

export function getStatusBadge(status: string | null) {
  const statuses = {
    NOUVEAU: { label: "Nouveau", variant: "destructive" as const },
    "EN COURS": { label: "En cours", variant: "default" as const },
    "EN ATTENTE DE PIECE": { label: "Attente pièces", variant: "secondary" as const },
    TERMINE: { label: "Terminé", variant: "outline" as const }
  }
  return statuses[status as keyof typeof statuses] || { label: status || "Nouveau", variant: "secondary" as const }
}

export function getWorkOrderStatusBadge(status: string | null) {
  const statuses = {
    "EN ATTENTE": { label: "En attente", variant: "secondary" as const },
    "PLANIFIE": { label: "Planifié", variant: "default" as const },
    "EN COURS": { label: "En cours", variant: "default" as const },
    "TERMINE": { label: "Terminé", variant: "outline" as const },
    "ANNULE": { label: "Annulé", variant: "destructive" as const }
  }
  return statuses[status as keyof typeof statuses] || { label: status || "En attente", variant: "secondary" as const }
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
