import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"

interface CalendarHeaderProps {
  title: string
  description: string
  canCreate: boolean
  currentMonth: Date
  onMonthChange: (month: Date) => void
  eventsCount: number
  onCreateClick?: () => void
  createButtonText?: string
}

export function CalendarHeader({
  title,
  description,
  canCreate,
  currentMonth,
  onMonthChange,
  eventsCount,
  onCreateClick,
  createButtonText = "Nouveau rendez-vous",
}: CalendarHeaderProps) {
  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        {canCreate && onCreateClick && (
          <Button className="bg-gradient-primary" onClick={onCreateClick}>
            <Plus className="w-4 h-4 mr-2" />
            {createButtonText}
          </Button>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {eventsCount} événement{eventsCount > 1 ? "s" : ""} ce mois
        </div>
      </div>
    </>
  )
}
