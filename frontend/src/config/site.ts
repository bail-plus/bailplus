export const siteConfig = {
  name: "BailloGenius",
  description: "La gestion locative qui génère vos quittances et vous laisse dormir tranquille",
  url: "https://bailogenius.fr",
  appUrl: "https://bailogenius-gestion-locative.lovable.app/app",
  contactEmail: "contact@bailogenius.fr",
  company: {
    name: "BailloGenius SAS",
    address: "Paris, France",
    siret: "12345678901234",
  },
  social: {
    linkedin: "https://linkedin.com/company/bailogenius",
    twitter: "https://twitter.com/bailogenius",
  },
  pricing: {
    starter: {
      name: "Starter",
      price: { monthly: 29, yearly: 290 },
      description: "Parfait pour débuter",
      maxProperties: 2,
      features: [
        "Jusqu'à 2 lots",
        "Quittances illimitées",
        "Gestion des charges",
        "Révision IRL",
        "Support par email",
      ],
    },
    pro: {
      name: "Pro",
      price: { monthly: 69, yearly: 690 },
      description: "Pour les bailleurs confirmés",
      maxProperties: 10,
      features: [
        "Jusqu'à 10 lots", 
        "Tout du Starter",
        "Maintenance avancée",
        "Rapports détaillés",
        "Export comptable",
        "Support prioritaire",
      ],
      popular: true,
    },
    enterprise: {
      name: "SCI/Entreprise",
      price: { monthly: "Sur devis", yearly: "Sur devis" },
      description: "Multi-entités et gestion avancée",
      maxProperties: "Illimité",
      features: [
        "Lots illimités",
        "Multi-entités/SCI",
        "API & intégrations",
        "Formation dédiée",
        "Account manager",
        "SLA garantie",
      ],
    },
  },
  features: {
    accounting: {
      title: "Comptabilité locative",
      description: "Encaissements, quittances PDF, révisions IRL automatiques",
      icon: "Calculator",
    },
    leasing: {
      title: "Gestion locative",
      description: "Du lead à la signature : visites, baux, états des lieux",
      icon: "Home",
    },
    maintenance: {
      title: "Maintenance",
      description: "Tickets, prestataires, work orders et suivi complet",
      icon: "Wrench",
    },
    documents: {
      title: "Coffre-fort numérique",
      description: "Stockage sécurisé et modèles (bail, quittance, EDL)",
      icon: "FileText",
    },
    communications: {
      title: "Communications",
      description: "E-mails et SMS automatisés avec modèles personnalisables",
      icon: "Mail",
    },
    reports: {
      title: "Rapports & Analytics",
      description: "Vacance, rendement, cash-flow et tableaux de bord",
      icon: "BarChart3",
    },
  },
} as const;