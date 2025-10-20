import { useState } from "react"
import { Download, Calendar, Building, Euro, AlertTriangle, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/ui/use-toast"
import { useReports } from "@/hooks/analytics/useReports"
import { Header } from "@/components/reports/Header"
import { MetricCard } from "@/components/reports/MetricCard"
import { CashFlowChart } from "@/components/reports/CashFlowChart"
import { VacancyChart } from "@/components/reports/VacancyChart"
import { ExpensesPieChart } from "@/components/reports/ExpensesPieChart"
import { ExportOptions } from "@/components/reports/ExportOptions"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export default function Reports() {
  const [period, setPeriod] = useState<string>("6")
  const { toast } = useToast()
  const months = parseInt(period)
  const { data: reportData, isLoading } = useReports(months)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement des rapports...</div>
      </div>
    )
  }

  const hasMonthlyData = reportData && reportData.monthlyData.length > 0
  const hasExpensesData = reportData && reportData.expensesByCategory.length > 0
  const monthlyTrend = hasMonthlyData
    ? reportData.monthlyData[reportData.monthlyData.length - 1].income - reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income
    : 0
  const trendPercentage = hasMonthlyData && reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income > 0
    ? ((monthlyTrend / reportData.monthlyData[Math.max(0, reportData.monthlyData.length - 2)].income) * 100).toFixed(1)
    : "0"

  const metrics = [
    {
      icon: Euro,
      title: "Revenus totaux",
      value: formatCurrency(reportData?.totalRent || 0),
      trend: Number(trendPercentage)
    },
    {
      icon: Building,
      title: "Taux de vacance",
      value: `${reportData?.vacancyRate || 0}%`,
      subtitle: `${reportData?.occupiedUnits || 0}/${reportData?.totalUnits || 0} logements occupés`
    },
    {
      icon: TrendingUp,
      title: "Rendement moyen",
      value: `${reportData?.totalRent > 0 ? ((reportData.totalRent / months) / (reportData.totalRent / 12 * 12) * 100).toFixed(1) : "0.0"}%`,
      subtitle: `Sur ${months} mois`
    },
    {
      icon: Calendar,
      title: "En attente",
      value: formatCurrency(reportData?.pendingAmount || 0),
      subtitle: "Factures à recevoir",
      color: "text-orange-600"
    },
    {
      icon: AlertTriangle,
      title: "Impayés",
      value: formatCurrency(reportData?.overdueAmount || 0),
      subtitle: "En retard de paiement",
      color: "text-destructive"
    }
  ]

  const exportButtons = [
    {
      title: "Rapport mensuel",
      subtitle: "PDF détaillé",
      icon: Download,
      onClick: () => toast({ title: "Génération du rapport", description: "Rapport PDF en cours de génération..." })
    },
    {
      title: "Données brutes",
      subtitle: "CSV Excel",
      icon: Calendar,
      onClick: () => toast({ title: "Export des données", description: "Export CSV en cours..." })
    },
    {
      title: "Analyse fiscale",
      subtitle: "2044/2072",
      icon: Building,
      onClick: () => toast({ title: "Analyse fiscale", description: "Génération de l'analyse fiscale..." })
    }
  ]

  return (
    <div className="space-y-6">
      <Header 
        period={period} 
        setPeriod={setPeriod}
        onExport={() => toast({
          title: "Export en cours",
          description: "Export CSV en cours de préparation..."
        })} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart data={reportData.monthlyData} hasData={hasMonthlyData} />
        <VacancyChart data={reportData.monthlyData} hasData={hasMonthlyData} />
        <ExpensesPieChart 
          data={reportData.expensesByCategory} 
          hasData={hasExpensesData}
          colors={['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#82ca9d', '#ffc658', '#ff7c7c']}
        />
      </div>

      <ExportOptions buttons={exportButtons} />
    </div>
  )
}