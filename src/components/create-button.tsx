import { useState } from "react"
import { Plus, Building2, FileText, Calculator, Wrench, Calendar } from "lucide-react"
import { PropertyModal } from "@/components/modals/property-modal"
import { LeaseModal } from "@/components/modals/lease-modal"
import { ReceiptModal } from "@/components/modals/receipt-modal"
import { ExpenseModal } from "@/components/modals/expense-modal"
import { TicketModal } from "@/components/modals/ticket-modal"
import { VisitModal } from "@/components/modals/visit-modal"
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
  const [propertyModalOpen, setPropertyModalOpen] = useState(false)
  const [leaseModalOpen, setLeaseModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [visitModalOpen, setVisitModalOpen] = useState(false)

  const handleItemClick = (action: string) => {
    setOpen(false)
    switch (action) {
      case 'property':
        setPropertyModalOpen(true)
        break
      case 'lease':
        setLeaseModalOpen(true)
        break
      case 'receipt':
        setReceiptModalOpen(true)
        break
      case 'expense':
        setExpenseModalOpen(true)
        break
      case 'ticket':
        setTicketModalOpen(true)
        break
      case 'visit':
        setVisitModalOpen(true)
        break
    }
  }

  return (
    <>
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
      
      <PropertyModal open={propertyModalOpen} onOpenChange={setPropertyModalOpen} />
      <LeaseModal open={leaseModalOpen} onOpenChange={setLeaseModalOpen} />
      <ReceiptModal open={receiptModalOpen} onOpenChange={setReceiptModalOpen} />
      <ExpenseModal open={expenseModalOpen} onOpenChange={setExpenseModalOpen} />
      <TicketModal open={ticketModalOpen} onOpenChange={setTicketModalOpen} />
      <VisitModal open={visitModalOpen} onOpenChange={setVisitModalOpen} />
    </>
  )
}