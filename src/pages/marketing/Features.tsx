import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator,
  Home,
  Wrench,
  FileText,
  Mail,
  BarChart3,
  ArrowRight,
  Check,
  Euro,
  Calendar,
  Users,
  Shield,
  Zap,
  Clock,
  Download,
  Bell,
  FileSpreadsheet,
  Printer,
  Database
} from "lucide-react";
import { siteConfig } from "@/config/site";

const featureDetails = {
  accounting: {
    title: "Comptabilité locative",
    description: "Gérez tous vos flux financiers et générez vos documents comptables automatiquement",
    icon: Calculator,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    features: [
      {
        title: "Quittances automatiques",
        description: "Génération PDF en 1 clic avec personnalisation",
        icon: Printer,
      },
      {
        title: "Révision IRL & Encadrement",
        description: "Calcul automatique des révisions légales",
        icon: Euro,
      },
      {
        title: "Suivi des impayés",
        description: "Alertes et relances automatisées",
        icon: Bell,
      },
      {
        title: "Rapprochement bancaire",
        description: "Import CSV et réconciliation automatique",
        icon: Database,
      },
      {
        title: "Export comptable",
        description: "Compatible Excel, expert-comptable",
        icon: FileSpreadsheet,
      },
      {
        title: "Provision pour charges",
        description: "Calcul et régularisation automatiques",
        icon: Calculator,
      },
    ],
  },
  leasing: {
    title: "Gestion locative",
    description: "Du premier contact à la signature, pilotez tout votre processus de location",
    icon: Home,
    color: "text-green-600",
    bgColor: "bg-green-50",
    features: [
      {
        title: "Gestion des candidatures",
        description: "Centralisation et scoring automatique",
        icon: Users,
      },
      {
        title: "Planning des visites",
        description: "Calendrier intégré et confirmations SMS",
        icon: Calendar,
      },
      {
        title: "Génération de baux",
        description: "Modèles à jour avec clauses légales",
        icon: FileText,
      },
      {
        title: "États des lieux",
        description: "EDL digitaux avec photos et signatures",
        icon: Check,
      },
      {
        title: "Signature électronique",
        description: "Légalement valable et traçable",
        icon: Shield,
      },
      {
        title: "Dossiers locataires",
        description: "Historique complet et documents",
        icon: Database,
      },
    ],
  },
  maintenance: {
    title: "Maintenance",
    description: "Organisez et suivez toutes vos interventions avec vos prestataires",
    icon: Wrench,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    features: [
      {
        title: "Tickets de maintenance",
        description: "Création et suivi complet des demandes",
        icon: Wrench,
      },
      {
        title: "Carnet d'adresses",
        description: "Base de données prestataires qualifiés",
        icon: Users,
      },
      {
        title: "Work orders",
        description: "Bons de travaux et devis intégrés",
        icon: FileText,
      },
      {
        title: "Planning interventions",
        description: "Calendrier partagé avec notifications",
        icon: Calendar,
      },
      {
        title: "Suivi des coûts",
        description: "Budget et facturation des travaux",
        icon: Euro,
      },
      {
        title: "Historique des interventions",
        description: "Carnet d'entretien digital par bien",
        icon: Clock,
      },
    ],
  },
  documents: {
    title: "Coffre-fort numérique",
    description: "Stockage sécurisé et modèles personnalisables pour tous vos documents",
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    features: [
      {
        title: "Stockage sécurisé",
        description: "Chiffrement et sauvegarde automatique",
        icon: Shield,
      },
      {
        title: "Modèles de documents",
        description: "Baux, quittances, EDL personnalisables",
        icon: FileText,
      },
      {
        title: "Organisation par bien",
        description: "Classement automatique et recherche",
        icon: Database,
      },
      {
        title: "Versioning",
        description: "Historique et versions de documents",
        icon: Clock,
      },
      {
        title: "Partage sécurisé",
        description: "Liens temporaires et droits d'accès",
        icon: Users,
      },
      {
        title: "Export en masse",
        description: "Téléchargement ZIP et synchronisation",
        icon: Download,
      },
    ],
  },
  communications: {
    title: "Communications",
    description: "Automatisez vos échanges avec locataires et prestataires",
    icon: Mail,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    features: [
      {
        title: "E-mails automatiques",
        description: "Relances, confirmations, notifications",
        icon: Mail,
      },
      {
        title: "SMS intégrés",
        description: "Notifications urgentes et rappels",
        icon: Bell,
      },
      {
        title: "Modèles personnalisables",
        description: "Bibliothèque de templates pro",
        icon: FileText,
      },
      {
        title: "Planification",
        description: "Envois programmés et récurrents",
        icon: Calendar,
      },
      {
        title: "Suivi des ouvertures",
        description: "Analytics et taux de lecture",
        icon: BarChart3,
      },
      {
        title: "Multi-canaux",
        description: "Email, SMS et notifications app",
        icon: Zap,
      },
    ],
  },
  reports: {
    title: "Rapports & Analytics",
    description: "Pilotez votre activité avec des tableaux de bord complets",
    icon: BarChart3,
    color: "text-red-600",
    bgColor: "bg-red-50",
    features: [
      {
        title: "Tableau de bord",
        description: "Vue d'ensemble temps réel",
        icon: BarChart3,
      },
      {
        title: "Analyse de rentabilité",
        description: "ROI et cash-flow par bien",
        icon: Euro,
      },
      {
        title: "Suivi de la vacance",
        description: "Taux et durée moyenne",
        icon: Calendar,
      },
      {
        title: "Rapports personnalisés",
        description: "Filtres avancés et exports",
        icon: FileSpreadsheet,
      },
      {
        title: "Prévisionnel",
        description: "Projections et budget annuel",
        icon: Calculator,
      },
      {
        title: "Alertes intelligentes",
        description: "Notifications sur seuils critiques",
        icon: Bell,
      },
    ],
  },
};

export default function Features() {
  return (
    <div className="py-12">
      {/* Hero */}
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Toutes les fonctionnalités pour{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              gérer votre patrimoine
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Découvrez en détail comment BailloGenius simplifie chaque aspect 
            de votre gestion locative, de la comptabilité aux rapports.
          </p>
          <Button size="lg" asChild>
            <a href={siteConfig.appUrl}>
              Essayer gratuitement
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Features Tabs */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="accounting" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-4xl grid-cols-2 lg:grid-cols-6 h-auto p-1">
                {Object.entries(featureDetails).map(([key, feature]) => {
                  const Icon = feature.icon;
                  return (
                    <TabsTrigger 
                      key={key} 
                      value={key}
                      className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium hidden sm:block">
                        {feature.title.split(' ')[0]}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {Object.entries(featureDetails).map(([key, feature]) => {
              const Icon = feature.icon;
              return (
                <TabsContent key={key} value={key} className="mt-8">
                  <div className="text-center mb-12">
                    <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                      {feature.title}
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                      {feature.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {feature.features.map((subFeature, index) => {
                      const SubIcon = subFeature.icon;
                      return (
                        <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <SubIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <CardTitle className="text-lg">{subFeature.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <CardDescription className="text-base">
                              {subFeature.description}
                            </CardDescription>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Intégrations et exports
            </h2>
            <p className="text-xl text-muted-foreground">
              BailloGenius s'intègre parfaitement dans votre écosystème
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <CardHeader>
                <FileSpreadsheet className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Expert-comptable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Exports Excel compatibles avec tous les logiciels comptables
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardHeader>
                <Database className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Import CSV</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Importez vos données bancaires et locataires existants
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6 text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>API Sécurisée</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Connectez vos outils métier via notre API REST
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Prêt à simplifier votre gestion locative ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Découvrez toutes ces fonctionnalités dans notre démo interactive
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href={siteConfig.appUrl}>
                Essayer la démo
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/pricing">
                Voir les tarifs
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}