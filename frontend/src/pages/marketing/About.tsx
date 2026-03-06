import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  Target, 
  Lightbulb,
  MapPin,
  Mail,
  Calendar,
  Trophy,
  Heart
} from "lucide-react";
import { siteConfig } from "@/config/site";

const timeline = [
  {
    year: "2023",
    title: "Création de BailloGenius",
    description: "Lancement de la première version avec génération de quittances et révision IRL automatique"
  },
  {
    year: "2024",
    title: "Expansion des fonctionnalités",
    description: "Ajout de la gestion des baux, maintenance, et coffre-fort numérique"
  },
  {
    year: "2024",
    title: "500+ bailleurs actifs",
    description: "Franchissement du cap des 500 utilisateurs et 10 000 quittances générées"
  },
  {
    year: "2025",
    title: "Nouveautés à venir",
    description: "API publique, application mobile native, et intégrations bancaires"
  }
];

const values = [
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Nous développons des solutions qui simplifient réellement la vie des bailleurs"
  },
  {
    icon: Heart,
    title: "Proximité",
    description: "Une équipe à l'écoute qui comprend les défis de la gestion locative"
  },
  {
    icon: Trophy,
    title: "Excellence",
    description: "Nous visons la qualité dans chaque fonctionnalité et interaction"
  }
];

const team = [
  {
    name: "Arthus MEYER",
    role: "CEO & Co-fondatrice",
    description: "Ex-directrice produit chez PropTech leader, investisseuse immobilière",
  },
  {
    name: "Edouard GAIGNEROT",
    role: "CTO & Co-fondateur", 
    description: "15 ans d'expérience en développement, expert en solutions SaaS",
  },
  {
    name: "Julien DION",
    role: "Head of Customer Success",
    description: "Spécialiste de l'accompagnement client, experte gestion locative",
  }
];

export default function About() {
  return (
    <div className="py-12">
      {/* Hero */}
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Notre mission :{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                simplifier la gestion locative
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              BailloGenius est né de la frustration de gérer manuellement un patrimoine immobilier. 
              Nous créons les outils que nous aurions aimé avoir quand nous étions bailleurs.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="px-4 py-2">
                <Users className="h-4 w-4 mr-2" />
                500+ bailleurs actifs
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <MapPin className="h-4 w-4 mr-2" />
                Fabriqué en France
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                Depuis 2023
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">
                  L'histoire de BailloGenius
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Tout a commencé par un constat simple : gérer un patrimoine immobilier, 
                    même de quelques lots, devient vite un casse-tête. Entre les quittances 
                    à créer chaque mois, les révisions IRL à calculer, et le suivi des 
                    impayés, nous perdions un temps précieux.
                  </p>
                  <p>
                    Les solutions existantes étaient soit trop complexes et chères pour 
                    les petits patrimoines, soit trop basiques pour une gestion efficace. 
                    C'est pourquoi nous avons créé BailloGenius : une solution moderne, 
                    intuitive et accessible à tous les bailleurs.
                  </p>
                  <p>
                    Aujourd'hui, plus de 500 bailleurs nous font confiance et économisent 
                    en moyenne 2 heures par mois grâce à nos automatisations. 
                    Notre mission continue : rendre la gestion locative aussi simple 
                    qu'un clic.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <Card className="p-6">
                  <CardHeader className="pb-4">
                    <Target className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Notre vision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Devenir la référence européenne de la gestion locative digitale 
                      pour les bailleurs particuliers et les SCI.
                    </CardDescription>
                  </CardContent>
                </Card>
                
                <Card className="p-6">
                  <CardHeader className="pb-4">
                    <Lightbulb className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Notre approche</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      Écouter nos utilisateurs, automatiser les tâches répétitives, 
                      et proposer une expérience utilisateur exceptionnelle.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Notre parcours
            </h2>
            <p className="text-xl text-muted-foreground">
              Les grandes étapes de BailloGenius
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-16 bg-border mt-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">{item.year}</Badge>
                      <h3 className="text-xl font-semibold text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Nos valeurs
            </h2>
            <p className="text-xl text-muted-foreground">
              Ce qui guide nos décisions au quotidien
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="p-8 text-center">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              L'équipe
            </h2>
            <p className="text-xl text-muted-foreground">
              Les personnes derrière BailloGenius
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="p-6 text-center">
                <CardHeader>
                  <div className="w-20 h-20 rounded-full bg-gradient-primary mx-auto mb-4 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {member.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-4">
                  Une question ? Envie d'échanger ?
                </CardTitle>
                <CardDescription className="text-lg">
                  Notre équipe est toujours ravie de discuter avec les bailleurs 
                  et de comprendre leurs défis pour améliorer BailloGenius.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-muted-foreground">{siteConfig.contactEmail}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Siège social</div>
                        <div className="text-muted-foreground">{siteConfig.company.address}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <Button asChild>
                      <a href="/contact">
                        Nous contacter
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={siteConfig.appUrl}>
                        Essayer BailloGenius
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
