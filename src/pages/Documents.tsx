import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Search, Download, Upload, Eye, File, Folder, Image } from "lucide-react"

const MOCK_DOCUMENTS = [
  {
    id: "1",
    name: "Bail Marie Dubois - T3 rue de la Paix",
    type: "LEASE",
    category: "Contrats",
    entityType: "Lease",
    entityId: "lease1",
    size: "245 KB",
    createdAt: "2023-06-01T10:00:00Z",
    downloadUrl: "#"
  },
  {
    id: "2",
    name: "Quittance Janvier 2024 - Marie Dubois",
    type: "RECEIPT",
    category: "Quittances",
    entityType: "RentInvoice",
    entityId: "invoice1",
    size: "128 KB",
    createdAt: "2024-01-05T14:30:00Z",
    downloadUrl: "#"
  },
  {
    id: "3",
    name: "État des lieux entrée - T3 rue de la Paix",
    type: "EDL",
    category: "États des lieux",
    entityType: "Lease",
    entityId: "lease1",
    size: "512 KB",
    createdAt: "2023-05-28T16:20:00Z",
    downloadUrl: "#"
  },
  {
    id: "4",
    name: "Dossier locataire - Pierre Martin",
    type: "OTHER",
    category: "KYC",
    entityType: "Person",
    entityId: "person2",
    size: "1.2 MB",
    createdAt: "2023-09-10T11:15:00Z",
    downloadUrl: "#"
  },
  {
    id: "5",
    name: "Facture plomberie - Janvier 2024",
    type: "OTHER",
    category: "Factures",
    entityType: "Expense",
    entityId: "expense1",
    size: "89 KB",
    createdAt: "2024-01-15T09:45:00Z",
    downloadUrl: "#"
  }
]

const DOCUMENT_CATEGORIES = [
  { value: "all", label: "Tous les documents" },
  { value: "Contrats", label: "Contrats" },
  { value: "Quittances", label: "Quittances" },
  { value: "États des lieux", label: "États des lieux" },
  { value: "KYC", label: "Documents locataires" },
  { value: "Factures", label: "Factures" },
  { value: "Lettres", label: "Lettres types" }
]

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  const filteredDocuments = MOCK_DOCUMENTS.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getDocumentIcon = (type: string) => {
    const icons = {
      LEASE: FileText,
      RECEIPT: File,
      EDL: Folder,
      LETTER: FileText,
      OTHER: File
    }
    return icons[type as keyof typeof icons] || File
  }

  const getDocumentBadge = (type: string) => {
    const types = {
      LEASE: { label: "Bail", variant: "default" as const },
      RECEIPT: { label: "Quittance", variant: "secondary" as const },
      EDL: { label: "EDL", variant: "outline" as const },
      LETTER: { label: "Lettre", variant: "secondary" as const },
      OTHER: { label: "Autre", variant: "secondary" as const }
    }
    return types[type as keyof typeof types] || { label: type, variant: "secondary" as const }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (size: string) => {
    return size
  }

  // Calculate stats
  const totalDocuments = MOCK_DOCUMENTS.length
  const documentsByCategory = MOCK_DOCUMENTS.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Coffre-fort numérique et génération de documents
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Importer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer un document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité d'import en cours de développement
                </p>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Générer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Générer un document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start gap-2">
                    <FileText className="w-4 h-4" />
                    Bail de location
                  </Button>
                  <Button variant="outline" className="justify-start gap-2">
                    <File className="w-4 h-4" />
                    Quittance de loyer
                  </Button>
                  <Button variant="outline" className="justify-start gap-2">
                    <Folder className="w-4 h-4" />
                    État des lieux
                  </Button>
                  <Button variant="outline" className="justify-start gap-2">
                    <FileText className="w-4 h-4" />
                    Lettre de relance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_CATEGORIES.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground mt-1">documents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quittances</span>
            </div>
            <div className="text-2xl font-bold">{documentsByCategory.Quittances || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">générées</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">États des lieux</span>
            </div>
            <div className="text-2xl font-bold">{documentsByCategory["États des lieux"] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">en stock</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Contrats</span>
            </div>
            <div className="text-2xl font-bold">{documentsByCategory.Contrats || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Génération rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <FileText className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Quittances du mois</div>
                <div className="text-xs text-muted-foreground">Janvier 2024</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Folder className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">État des lieux</div>
                <div className="text-xs text-muted-foreground">Entrée/Sortie</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <FileText className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Lettres de relance</div>
                <div className="text-xs text-muted-foreground">Impayés</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <File className="w-6 h-6" />
              <div className="text-center">
                <div className="font-medium">Modèles vides</div>
                <div className="text-xs text-muted-foreground">À personnaliser</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Liste des documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => {
                const IconComponent = getDocumentIcon(document.type)
                const badgeConfig = getDocumentBadge(document.type)
                
                return (
                  <TableRow 
                    key={document.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedDocument(document)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{document.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {document.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={badgeConfig.variant} className="text-xs">
                        {badgeConfig.label}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm">{document.category}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatFileSize(document.size)}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{formatDate(document.createdAt)}</span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Eye className="w-3 h-3" />
                          Voir
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-1">
                          <Download className="w-3 h-3" />
                          Télécharger
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedDocument.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {getDocumentBadge(selectedDocument.type).label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Catégorie:</span> {selectedDocument.category}
                </div>
                <div>
                  <span className="font-medium">Taille:</span> {formatFileSize(selectedDocument.size)}
                </div>
                <div>
                  <span className="font-medium">Créé le:</span> {formatDate(selectedDocument.createdAt)}
                </div>
              </div>

              {/* Document Preview */}
              <div className="border rounded-lg p-8 bg-muted/20 text-center">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Prévisualisation PDF en cours de développement
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Le document sera affiché ici une fois la fonctionnalité implémentée
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button className="gap-2">
                  <Download className="w-4 h-4" />
                  Télécharger
                </Button>
                <Button variant="outline" className="gap-2">
                  <Eye className="w-4 h-4" />
                  Ouvrir dans un nouvel onglet
                </Button>
                <Button variant="outline">
                  Partager
                </Button>
                <Button variant="outline" className="text-destructive">
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}