import { Search } from "lucide-react"
import { ProviderSearch } from "@/components/providers/ProviderSearch"

export default function FindProviders() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Search className="w-8 h-8" />
            Trouver un prestataire
          </h1>
          <p className="text-muted-foreground mt-1">
            Recherchez des prestataires de service près de vos propriétés
          </p>
        </div>
      </div>

      {/* Search Component */}
      <ProviderSearch />
    </div>
  )
}
