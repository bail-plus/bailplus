import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Check, 
  X, 
  ArrowRight, 
  Star,
  Shield,
  Headphones,
  Zap,
  Users
} from "lucide-react";
import { siteConfig } from "@/config/site";

const features = [
  { name: "Nombre de lots", starter: "2", pro: "10", enterprise: "Illimité" },
  { name: "Quittances PDF", starter: true, pro: true, enterprise: true },
  { name: "Révision IRL automatique", starter: true, pro: true, enterprise: true },
  { name: "Gestion des charges", starter: true, pro: true, enterprise: true },
  { name: "Suivi des impayés", starter: true, pro: true, enterprise: true },
  { name: "Planning des visites", starter: false, pro: true, enterprise: true },
  { name: "États des lieux digitaux", starter: false, pro: true, enterprise: true },
  { name: "Maintenance avancée", starter: false, pro: true, enterprise: true },
  { name: "Communications automatisées", starter: false, pro: true, enterprise: true },
  { name: "Rapports détaillés", starter: false, pro: true, enterprise: true },
  { name: "Export comptable", starter: false, pro: true, enterprise: true },
  { name: "Multi-entités/SCI", starter: false, pro: false, enterprise: true },
  { name: "API & intégrations", starter: false, pro: false, enterprise: true },
  { name: "Formation dédiée", starter: false, pro: false, enterprise: true },
  { name: "Account manager", starter: false, pro: false, enterprise: true },
  { name: "SLA garantie", starter: false, pro: false, enterprise: true },
];

const supportLevels = {
  starter: { icon: Headphones, label: "Support par email", description: "Réponse sous 48h" },
  pro: { icon: Zap, label: "Support prioritaire", description: "Réponse sous 24h + chat" },
  enterprise: { icon: Users, label: "Account manager", description: "Support dédié + hotline" },
};

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { pricing } = siteConfig;

  const getPrice = (plan: keyof typeof pricing) => {
    const planData = pricing[plan];
    if (typeof planData.price === 'string') return planData.price;
    return isYearly ? planData.price.yearly : planData.price.monthly;
  };

  const getPeriod = () => isYearly ? "an" : "mois";

  return (
    <div className="py-12">
      {/* Hero */}
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Tarifs simples et{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              transparents
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Choisissez l'offre qui correspond à la taille de votre patrimoine. 
            Pas de frais cachés, résiliable à tout moment.
          </p>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Label htmlFor="yearly-toggle" className={!isYearly ? "font-semibold" : ""}>
              Mensuel
            </Label>
            <Switch
              id="yearly-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="yearly-toggle" className={isYearly ? "font-semibold" : ""}>
              Annuel
            </Label>
            {isYearly && (
              <Badge variant="secondary" className="ml-2">
                <Star className="h-3 w-3 mr-1" />
                2 mois offerts
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter */}
            <Card className="relative p-8">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription className="text-base">
                  {pricing.starter.description}
                </CardDescription>
                <div className="flex items-baseline gap-2 pt-4">
                  <span className="text-4xl font-bold">
                    {typeof getPrice('starter') === 'number' ? `${getPrice('starter')}€` : getPrice('starter')}
                  </span>
                  {typeof getPrice('starter') === 'number' && (
                    <span className="text-muted-foreground">/{getPeriod()}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" asChild>
                  <a href={`${siteConfig.appUrl}/sign-up?plan=starter`}>
                    Commencer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <supportLevels.starter.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{supportLevels.starter.label}</div>
                      <div className="text-sm text-muted-foreground">{supportLevels.starter.description}</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 pt-4">
                  {pricing.starter.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="relative p-8 border-primary shadow-lg scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="px-4 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Populaire
                </Badge>
              </div>
              
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription className="text-base">
                  {pricing.pro.description}
                </CardDescription>
                <div className="flex items-baseline gap-2 pt-4">
                  <span className="text-4xl font-bold">
                    {typeof getPrice('pro') === 'number' ? `${getPrice('pro')}€` : getPrice('pro')}
                  </span>
                  {typeof getPrice('pro') === 'number' && (
                    <span className="text-muted-foreground">/{getPeriod()}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" asChild>
                  <a href={`${siteConfig.appUrl}/sign-up?plan=pro`}>
                    Commencer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <supportLevels.pro.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{supportLevels.pro.label}</div>
                      <div className="text-sm text-muted-foreground">{supportLevels.pro.description}</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 pt-4">
                  {pricing.pro.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Enterprise */}
            <Card className="relative p-8">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">SCI/Entreprise</CardTitle>
                <CardDescription className="text-base">
                  {pricing.enterprise.description}
                </CardDescription>
                <div className="flex items-baseline gap-2 pt-4">
                  <span className="text-4xl font-bold">Sur devis</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline" asChild>
                  <a href="/contact">
                    Nous contacter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                
                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <supportLevels.enterprise.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{supportLevels.enterprise.label}</div>
                      <div className="text-sm text-muted-foreground">{supportLevels.enterprise.description}</div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 pt-4">
                  {pricing.enterprise.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Comparaison détaillée
            </h2>
            <p className="text-xl text-muted-foreground">
              Toutes les fonctionnalités en un coup d'œil
            </p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <table className="w-full bg-background rounded-lg shadow-lg">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-6 font-semibold">Fonctionnalités</th>
                  <th className="text-center p-6 font-semibold">Starter</th>
                  <th className="text-center p-6 font-semibold">Pro</th>
                  <th className="text-center p-6 font-semibold">Entreprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{feature.name}</td>
                    <td className="p-4 text-center">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-medium">{feature.starter}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-medium">{feature.pro}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="h-5 w-5 text-success mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mx-auto" />
                        )
                      ) : (
                        <span className="font-medium">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Sécurité et conformité
            </h2>
            <p className="text-xl text-muted-foreground">
              Vos données sont protégées selon les plus hautes normes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">RGPD Compliant</h3>
              <p className="text-muted-foreground">
                Conformité totale avec le règlement européen
              </p>
            </div>
            
            <div className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Hébergement UE</h3>
              <p className="text-muted-foreground">
                Serveurs en Europe, données souveraines
              </p>
            </div>
            
            <div className="text-center">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chiffrement SSL</h3>
              <p className="text-muted-foreground">
                Communications sécurisées bout en bout
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Pricing */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Questions sur les tarifs
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Puis-je changer d'offre ?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Oui, vous pouvez upgrader ou downgrader à tout moment. 
                  Les changements prennent effet immédiatement.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Y a-t-il un engagement ?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Aucun engagement. Vous pouvez résilier à tout moment depuis votre espace client.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-lg">Acceptez-vous tous les moyens de paiement ?</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Nous acceptons toutes les cartes bancaires (Visa, Mastercard, Amex) 
                  et les virements SEPA pour les entreprises.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Legal Note */}
      <section className="py-12 bg-muted/10">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            Prix HT. TVA de 20% applicable selon la législation française. 
            Factures conformes aux obligations comptables.
          </p>
        </div>
      </section>
    </div>
  );
}