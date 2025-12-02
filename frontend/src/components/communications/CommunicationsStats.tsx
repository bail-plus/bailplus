import { Card, CardContent } from "@/components/ui/card"
import { Send, CheckCircle, Clock, Mail } from "lucide-react"

interface CommunicationsStatsProps {
  totalMessages: number
  deliveredMessages: number
  pendingMessages: number
  emailMessages: number
  smsMessages: number
}

export function CommunicationsStats({
  totalMessages,
  deliveredMessages,
  pendingMessages,
  emailMessages,
  smsMessages,
}: CommunicationsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Total envoyé</span>
          </div>
          <div className="text-2xl font-bold">{totalMessages}</div>
          <p className="text-xs text-muted-foreground mt-1">messages</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Livrés</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{deliveredMessages}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalMessages > 0 ? ((deliveredMessages / totalMessages) * 100).toFixed(0) : 0}% de succès
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium">En attente</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{pendingMessages}</div>
          <p className="text-xs text-muted-foreground mt-1">en cours</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Emails</span>
          </div>
          <div className="text-2xl font-bold">{emailMessages}</div>
          <p className="text-xs text-muted-foreground mt-1">
            vs {smsMessages} SMS
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
