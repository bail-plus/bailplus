import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"
import type { ContactWithLeaseInfo } from "@/hooks/properties/useContacts"

interface PeopleStatsProps {
  contacts: ContactWithLeaseInfo[]
}

export function PeopleStats({ contacts }: PeopleStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total Garants</span>
          </div>
          <div className="text-2xl font-bold">{contacts.length}</div>
        </CardContent>
      </Card>
    </div>
  )
}
