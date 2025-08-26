import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Star, 
  Shield, 
  Zap,
  Calculator,
  Home,
  Wrench,
  FileText,
  Mail,
  BarChart3,
  Check,
  Users,
  Clock,
  DollarSign
} from "lucide-react";
import { siteConfig } from "@/config/site";

const testimonials = [
  {
    name: "Marie Dubois",
    role: "Propriétaire de 5 lots",
    content: "Plus besoin de courir après les quittances ! BailloGenius me fait gagner 2h par mois.",
    rating: 5,
  },
  {
    name: "Jean-Pierre Martin",
    role: "Gérant SCI",
    content: "La révision IRL automatique et les rapports me simplifient énormément la gestion.",
    rating: 5,
  },
  {
    name: "Sophie Lefort",
    role: "Investisseur débutant",
    content: "Interface intuitive, j'ai pu créer mon premier bail en 10 minutes !",
    rating: 5,
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Ajoutez vos biens",
    description: "Créez votre portefeuille en quelques clics avec toutes les informations essentielles.",
    icon: Home,
  },
  {
    step: 2,
    title: "Créez le bail",
    description: "Générez automatiquement vos baux avec les clauses légales à jour.",
    icon: FileText,
  },
  {
    step: 3,
    title: "Encaissez & générez",
    description: "Suivez les paiements et créez vos quittances PDF en un clic.",
    icon: DollarSign,
  },
];

const features = [
  {
    icon: Calculator,
    title: "Comptabilité locative",
    description: "Quittances automatiques, révision IRL, suivi des impayés",
  },
  {
    icon: Home,
    title: "Gestion des baux",
    description: "De la visite à la signature, gérez tout votre processus locatif",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "Tickets, prestataires et suivi des interventions",
  },
  {
    icon: FileText,
    title: "Documents",
    description: "Coffre-fort numérique et modèles personnalisables",
  },
  {
    icon: Mail,
    title: "Communications",
    description: "E-mails et SMS automatisés pour vos locataires",
  },
  {
    icon: BarChart3,
    title: "Rapports",
    description: "Analytics et tableaux de bord pour piloter votre activité",
  },
];

const stats = [
  { label: "Bailleurs actifs", value: "500+", icon: Users },
  { label: "Temps économisé/mois", value: "2h", icon: Clock },
  { label: "Quittances générées", value: "10k+", icon: FileText },
];

export default function Landing() {
  console.log('🎉 Landing page loading correctly!');
  
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-surface">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="flex gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  <Shield className="h-3 w-3 mr-1" />
                  RGPD
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Hébergement UE
                </Badge>
                <Badge variant="secondary" className="px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Mode démo
                </Badge>
              </div>
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              La gestion locative qui génère vos{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                quittances
              </span>{" "}
              et vous laisse dormir tranquille
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Quittances en 1 clic, IRL & encadrement, maintenance, rapprochement — 
              pensé pour bailleurs et SCI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" asChild>
                <Link to="/app">
                  Accéder à l'application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8" asChild>
                <Link to="/signup">
                  S'inscrire gratuitement
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-muted-foreground">
              Découvrez ce que disent nos utilisateurs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-1 pb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <CardDescription>"{testimonial.content}"</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin pour{" "}
              <span className="text-primary">gérer votre patrimoine</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d'outils pensés pour simplifier votre quotidien de bailleur
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/features">
                Voir toutes les fonctionnalités
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-muted-foreground">
              3 étapes pour commencer à gérer vos biens efficacement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-muted-foreground">
              Les réponses aux questions que vous vous posez
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Combien coûte BailloGenius ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  À partir de 29€/mois pour 2 lots. <Link to="/offers" className="text-primary hover:underline">Découvrez nos offres</Link>.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Y a-t-il un essai gratuit ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Oui ! Accédez à notre démo en 2 minutes, sans carte bancaire.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Puis-je importer mes données ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Absolument ! Nous proposons un import CSV et une migration assistée.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  Mes données sont-elles sécurisées ?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  100% ! Hébergement en UE, conformité RGPD et chiffrement de bout en bout.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/faq">
                Voir toutes les FAQ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Essayez la démo en 2 minutes
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Sans carte bancaire — découvrez pourquoi +500 bailleurs nous font confiance
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8" asChild>
              <Link to="/app">
                Accéder à l'application
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/signup">
                S'inscrire gratuitement
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}