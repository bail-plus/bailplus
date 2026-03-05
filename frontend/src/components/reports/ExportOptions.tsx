import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface ExportButton {
  title: string
  subtitle: string
  icon: LucideIcon
  onClick: () => void
}

interface ExportOptionsProps {
  buttons: ExportButton[]
}

export function ExportOptions({ buttons }: ExportOptionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Exports disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {buttons.map((btn, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={btn.onClick}
            >
              <btn.icon className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">{btn.title}</div>
                <div className="text-xs text-muted-foreground">{btn.subtitle}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}