import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  ArrowRight, 
  Calendar, 
  User,
  Search,
  TrendingUp,
  FileText,
  Calculator,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

// Demo blog posts - in a real app, these would come from a CMS or MDX files
const blogPosts = [
  {
    id: "revision-irl-2024",
    title: "Révision IRL 2024 : Guide complet pour les bailleurs",
    excerpt: "Tout ce que vous devez savoir sur la révision des loyers avec l'indice de référence des loyers pour l'année 2024.",
    content: "La révision des loyers selon l'IRL (Indice de Référence des Loyers) est un mécanisme légal qui permet aux propriétaires bailleurs d'ajuster le montant des loyers...",
    author: "Marie Dupont",
    date: "2024-03-15",
    readTime: "5 min",
    category: "Réglementation",
    tags: ["IRL", "Révision", "Loyers", "2024"],
    featured: true
  },
  {
    id: "optimiser-fiscalite-sci",
    title: "SCI : Comment optimiser sa fiscalité en 2024",
    excerpt: "Découvrez les stratégies fiscales pour maximiser la rentabilité de votre SCI et réduire légalement vos impôts.",
    content: "La Société Civile Immobilière (SCI) offre de nombreux avantages fiscaux aux investisseurs immobiliers. Dans cet article, nous explorons...",
    author: "Thomas Martin",
    date: "2024-03-10",
    readTime: "8 min",
    category: "Fiscalité",
    tags: ["SCI", "Fiscalité", "Optimisation", "Immobilier"],
    featured: false
  },
  {
    id: "gestion-impaye-locataire",
    title: "Gérer un impayé de loyer : Procédure étape par étape",
    excerpt: "Guide pratique pour gérer efficacement les impayés de loyers, de la relance amiable à la procédure judiciaire.",
    content: "Les impayés de loyers sont malheureusement une réalité que tout bailleur peut rencontrer. Voici la marche à suivre pour gérer ces situations...",
    author: "Sophie Bernard",
    date: "2024-03-05",
    readTime: "6 min",
    category: "Gestion locative",
    tags: ["Impayés", "Procédure", "Bailleur", "Droits"],
    featured: false
  }
];

const categories = [
  { name: "Tous", count: 25 },
  { name: "Réglementation", count: 8 },
  { name: "Fiscalité", count: 6 },
  { name: "Gestion locative", count: 7 },
  { name: "Conseils", count: 4 }
];

const resources = [
  {
    title: "Calculateur de révision IRL",
    description: "Calculez automatiquement la révision de vos loyers selon l'indice IRL",
    icon: Calculator,
    type: "Outil"
  },
  {
    title: "Modèles de lettres",
    description: "Téléchargez nos modèles de relances et de courriers officiels",
    icon: FileText,
    type: "Template"
  },
  {
    title: "Guide du bailleur débutant",
    description: "PDF complet pour bien commencer dans l'investissement locatif",
    icon: BookOpen,
    type: "Guide"
  }
];

export default function Resources() {
  return (
    <div className="py-12">
      {/* Hero */}
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ressources &{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              conseils
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Guides, actualités et outils pour vous accompagner dans votre 
            gestion locative et maximiser la rentabilité de votre patrimoine.
          </p>
        </div>
      </section>

      {/* Search & Categories */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between max-w-4xl mx-auto">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un article..."
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.name}
                  variant={category.name === "Tous" ? "default" : "outline"}
                  size="sm"
                  className="whitespace-nowrap"
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <Badge className="mb-4">Article mis en avant</Badge>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                À la une
              </h2>
            </div>

            {blogPosts
              .filter(post => post.featured)
              .map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="bg-gradient-primary p-12 flex items-center justify-center">
                      <div className="text-center text-primary-foreground">
                        <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                        <Badge variant="secondary" className="mb-4">
                          {post.category}
                        </Badge>
                        <h3 className="text-xl font-semibold">
                          Article tendance
                        </h3>
                      </div>
                    </div>
                    
                    <CardContent className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.date).toLocaleDateString('fr-FR')}
                        </div>
                        <Badge variant="outline">{post.readTime}</Badge>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        {post.title}
                      </h3>
                      
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button asChild>
                        <Link to={`/resources/${post.id}`}>
                          Lire l'article
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
              Derniers articles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts
                .filter(post => !post.featured)
                .map((post) => (
                  <Card key={post.id} className="h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{post.category}</Badge>
                        <span className="text-sm text-muted-foreground">{post.readTime}</span>
                      </div>
                      <CardTitle className="text-xl leading-tight">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col">
                      <CardDescription className="mb-4 flex-1 leading-relaxed">
                        {post.excerpt}
                      </CardDescription>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {post.author}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/resources/${post.id}`}>
                            Lire
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools & Resources */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Outils & téléchargements
              </h2>
              <p className="text-xl text-muted-foreground">
                Ressources pratiques pour faciliter votre gestion locative
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resources.map((resource, index) => {
                const Icon = resource.icon;
                return (
                  <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <Badge variant="outline" className="mb-2">
                        {resource.type}
                      </Badge>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base mb-4">
                        {resource.description}
                      </CardDescription>
                      <Button variant="outline" className="w-full">
                        Télécharger
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Restez informé des dernières actualités
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Recevez nos conseils exclusifs et les nouveautés BailloGenius 
            directement dans votre boîte mail.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Input
              placeholder="Votre adresse email"
              className="bg-primary-foreground text-foreground"
            />
            <Button variant="secondary" className="px-8">
              S'abonner
            </Button>
          </div>
          
          <p className="text-sm text-primary-foreground/70 mt-4">
            Pas de spam, désinscription en un clic
          </p>
        </div>
      </section>
    </div>
  );
}