import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

export default function Terms() {
  return (
    <div className="py-12">
      {/* Header */}
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Conditions Générales{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              d'Utilisation
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Dernière mise à jour : 15 mars 2024
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 prose prose-gray max-w-none">
                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">1. Objet</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation de la plateforme BailloGenius, éditée par {siteConfig.company.name}, société par actions simplifiée au capital de 10 000 euros, immatriculée au RCS de Paris sous le numéro {siteConfig.company.siret}, dont le siège social est situé {siteConfig.company.address}.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Définitions</h2>
                    <div className="space-y-3 text-muted-foreground">
                      <p><strong>Plateforme :</strong> Le service BailloGenius accessible à l'adresse {siteConfig.url}</p>
                      <p><strong>Utilisateur :</strong> Toute personne physique ou morale utilisant la Plateforme</p>
                      <p><strong>Client :</strong> Utilisateur ayant souscrit à un abonnement payant</p>
                      <p><strong>Services :</strong> L'ensemble des fonctionnalités proposées par la Plateforme</p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Acceptation des CGU</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. L'Utilisateur est réputé avoir pris connaissance des CGU et les avoir acceptées en cochant la case prévue à cet effet lors de son inscription ou en utilisant la Plateforme.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Inscription et compte utilisateur</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p>
                        L'inscription sur la Plateforme est gratuite. L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription.
                      </p>
                      <p>
                        L'Utilisateur est responsable de la confidentialité de ses identifiants de connexion et s'engage à ne pas les divulguer à des tiers.
                      </p>
                      <p>
                        En cas d'utilisation frauduleuse du compte, l'Utilisateur s'engage à en informer immédiatement BailloGenius.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Services proposés</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p>BailloGenius propose les services suivants :</p>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Gestion de quittances de loyer</li>
                        <li>Suivi des encaissements</li>
                        <li>Gestion des baux et des locataires</li>
                        <li>Maintenance et suivi des interventions</li>
                        <li>Stockage sécurisé de documents</li>
                        <li>Génération de rapports</li>
                      </ul>
                      <p>
                        La liste des services peut évoluer sans préavis. BailloGenius s'efforce de maintenir la disponibilité des Services mais ne peut garantir une disponibilité à 100%.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Abonnements et tarification</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p>
                        L'accès aux Services premium nécessite la souscription d'un abonnement payant. Les tarifs sont indiqués sur le site et peuvent être modifiés à tout moment.
                      </p>
                      <p>
                        Les prix sont exprimés en euros toutes taxes comprises. Le paiement s'effectue par carte bancaire ou virement selon les modalités proposées.
                      </p>
                      <p>
                        L'abonnement est renouvelé automatiquement sauf résiliation par l'Utilisateur.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">7. Résiliation</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p>
                        L'Utilisateur peut résilier son abonnement à tout moment depuis son espace client. La résiliation prend effet à la fin de la période d'abonnement en cours.
                      </p>
                      <p>
                        BailloGenius se réserve le droit de suspendre ou résilier l'accès aux Services en cas de manquement aux présentes CGU.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">8. Protection des données</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Le traitement des données personnelles est régi par notre Politique de Confidentialité, conforme au RGPD. L'Utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">9. Responsabilité</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p>
                        BailloGenius s'efforce de fournir des Services de qualité mais ne peut garantir l'absence d'erreurs ou d'interruptions.
                      </p>
                      <p>
                        La responsabilité de BailloGenius ne peut être engagée en cas de dommages indirects ou de perte de données.
                      </p>
                      <p>
                        L'Utilisateur est seul responsable de l'utilisation qu'il fait des Services et des données qu'il saisit.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">10. Propriété intellectuelle</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      La Plateforme et tous ses éléments (textes, images, codes, etc.) sont protégés par le droit d'auteur. Toute reproduction non autorisée est interdite.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">11. Droit applicable et juridiction</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux de Paris seront seuls compétents.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">12. Contact</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Pour toute question concernant les présentes CGU, vous pouvez nous contacter à l'adresse : {siteConfig.contactEmail}
                    </p>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}