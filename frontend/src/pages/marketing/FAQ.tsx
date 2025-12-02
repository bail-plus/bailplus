import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, ArrowRight, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

const faqCategories = [
  {
    title: "Généralités",
    items: [
      {
        question: "Qu'est-ce que BailloGenius ?",
        answer: "BailloGenius est une solution complète de gestion locative qui automatise la création de quittances, le suivi des loyers, la révision IRL, et bien plus. C'est l'outil indispensable pour les bailleurs et les SCI qui veulent simplifier leur gestion."
      },
      {
        question: "À qui s'adresse BailloGenius ?",
        answer: "Notre solution s'adresse aux propriétaires bailleurs (particuliers), aux SCI, aux petites agences immobilières et aux gestionnaires de patrimoine qui gèrent entre 1 et plusieurs centaines de lots."
      },
      {
        question: "Combien coûte BailloGenius ?",
        answer: "Nos tarifs démarrent à 29€/mois HT pour l'offre Starter (jusqu'à 2 lots). L'offre Pro coûte 69€/mois HT (jusqu'à 10 lots). Pour les SCI et entreprises, nous proposons des tarifs sur devis adaptés à vos besoins."
      },
      {
        question: "Y a-t-il un essai gratuit ?",
        answer: "Oui ! Vous pouvez accéder à notre démo interactive en 2 minutes sans carte bancaire. Cela vous permet de tester toutes les fonctionnalités avec des données de démonstration."
      }
    ]
  },
  {
    title: "Fonctionnalités",
    items: [
      {
        question: "Comment fonctionne la génération de quittances ?",
        answer: "Une fois vos biens et locataires configurés, vous pouvez générer des quittances PDF personnalisées en un clic. Le système calcule automatiquement les montants (loyer + charges) et applique la révision IRL si nécessaire."
      },
      {
        question: "BailloGenius gère-t-il la révision IRL ?",
        answer: "Absolument ! Le système calcule automatiquement les révisions IRL en fonction de l'indice publié par l'INSEE. Vous n'avez plus à vous soucier des calculs ni des dates de révision."
      },
      {
        question: "Puis-je gérer la maintenance avec BailloGenius ?",
        answer: "Oui, notre module maintenance vous permet de créer des tickets, gérer vos prestataires, planifier les interventions et suivre les coûts. Vous avez une vue complète de l'historique de maintenance par bien."
      },
      {
        question: "Les documents sont-ils sécurisés ?",
        answer: "Tous vos documents sont stockés de manière sécurisée avec un chiffrement de bout en bout. Nous respectons le RGPD et hébergeons vos données en Europe. Vous gardez le contrôle total de vos informations."
      }
    ]
  },
  {
    title: "Technique",
    items: [
      {
        question: "Puis-je importer mes données existantes ?",
        answer: "Oui ! Nous proposons plusieurs moyens d'import : CSV pour vos locataires et biens, rapprochement bancaire via fichiers CSV, et une migration assistée gratuite depuis d'autres logiciels."
      },
      {
        question: "BailloGenius propose-t-il une API ?",
        answer: "Une API REST est disponible avec l'offre Entreprise. Elle permet d'intégrer BailloGenius avec vos autres outils (comptabilité, CRM, etc.) et d'automatiser certaines tâches."
      },
      {
        question: "L'application fonctionne-t-elle sur mobile ?",
        answer: "BailloGenius est une application web responsive qui s'adapte parfaitement aux smartphones et tablettes. Vous pouvez gérer vos biens depuis n'importe quel appareil."
      },
      {
        question: "Puis-je exporter mes données ?",
        answer: "Bien sûr ! Vous pouvez exporter vos données en Excel/CSV à tout moment. Cela inclut vos locataires, biens, encaissements, et tous les documents que vous avez générés."
      }
    ]
  },
  {
    title: "Support & Facturation",
    items: [
      {
        question: "Quel support est inclus ?",
        answer: "L'offre Starter inclut un support par email avec réponse sous 48h. L'offre Pro bénéficie d'un support prioritaire (24h) avec chat en ligne. L'offre Entreprise inclut un account manager dédié."
      },
      {
        question: "Comment résilier mon abonnement ?",
        answer: "Vous pouvez résilier à tout moment depuis votre espace client, sans préavis ni frais. Vos données restent accessibles pendant 30 jours après résiliation pour vous permettre d'exporter ce dont vous avez besoin."
      },
      {
        question: "Acceptez-vous les virements ?",
        answer: "Oui, nous acceptons les cartes bancaires (paiement mensuel ou annuel) et les virements SEPA pour les entreprises et SCI (paiement annuel uniquement)."
      },
      {
        question: "Proposez-vous des formations ?",
        answer: "Nous proposons des webinaires gratuits chaque semaine, une documentation complète, et des formations personnalisées pour les clients Entreprise. Notre équipe support vous accompagne dans la prise en main."
      }
    ]
  },
  {
    title: "Légal & Conformité",
    items: [
      {
        question: "BailloGenius est-il conforme au RGPD ?",
        answer: "Oui, nous respectons strictement le RGPD. Vos données sont hébergées en Europe, chiffrées, et vous gardez le contrôle total. Nous ne vendons jamais vos données et vous pouvez demander leur suppression à tout moment."
      },
      {
        question: "Les quittances générées sont-elles légalement valables ?",
        answer: "Absolument ! Nos modèles de quittances respectent la réglementation française et incluent toutes les mentions obligatoires. Elles ont la même valeur légale que des quittances manuscrites."
      },
      {
        question: "Les baux générés sont-ils à jour ?",
        answer: "Nos modèles de baux sont régulièrement mis à jour par notre équipe juridique pour respecter la législation en vigueur (loi ALUR, ELAN, etc.). Vous êtes toujours en conformité."
      }
    ]
  }
];

export default function FAQ() {
  return (
    <div className="py-12">
      {/* Hero */}
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Foire aux{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              questions
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Trouvez rapidement les réponses à vos questions sur BailloGenius, 
            nos fonctionnalités et nos tarifs.
          </p>
          <Button variant="outline" size="lg" asChild>
            <a href="/contact">
              <MessageCircle className="mr-2 h-4 w-4" />
              Une question spécifique ?
            </a>
          </Button>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 pb-3 border-b border-border">
                  {category.title}
                </h2>
                
                <Accordion type="single" collapsible className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem 
                      key={itemIndex} 
                      value={`${categoryIndex}-${itemIndex}`}
                      className="border border-border rounded-lg px-6"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-6">
                        <span className="font-semibold text-foreground pr-4">
                          {item.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <CardHeader>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-4">
                  Vous ne trouvez pas la réponse ?
                </CardTitle>
                <CardDescription className="text-lg">
                  Notre équipe support est là pour vous aider. 
                  Contactez-nous et nous vous répondrons rapidement.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <a href="/contact">
                      Nous contacter
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href={siteConfig.appUrl}>
                      Essayer la démo
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* JSON-LD Schema for FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqCategories.flatMap((category) =>
              category.items.map((item) => ({
                "@type": "Question",
                "name": item.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": item.answer
                }
              }))
            )
          })
        }}
      />
    </div>
  );
}