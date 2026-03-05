import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, Trash2 } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function Privacy() {
  return (
    <div className="py-12">
      {/* Header */}
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Politique de{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Confidentialité
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Dernière mise à jour : 15 mars 2024
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="secondary">
              <Shield className="h-3 w-3 mr-1" />
              RGPD Compliant
            </Badge>
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Données chiffrées
            </Badge>
            <Badge variant="secondary">
              <Eye className="h-3 w-3 mr-1" />
              Transparence totale
            </Badge>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 prose prose-gray max-w-none">
                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">1. Responsable du traitement</h2>
                    <div className="text-muted-foreground leading-relaxed space-y-2">
                      <p><strong>Société :</strong> {siteConfig.company.name}</p>
                      <p><strong>Adresse :</strong> {siteConfig.company.address}</p>
                      <p><strong>SIRET :</strong> {siteConfig.company.siret}</p>
                      <p><strong>Email :</strong> {siteConfig.contactEmail}</p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Données collectées</h2>
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-foreground">Données d'identification</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                        <li>Nom, prénom</li>
                        <li>Adresse email</li>
                        <li>Numéro de téléphone (optionnel)</li>
                        <li>Adresse postale (pour facturation)</li>
                      </ul>

                      <h3 className="text-xl font-semibold text-foreground">Données de gestion locative</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                        <li>Informations sur vos biens immobiliers</li>
                        <li>Données des locataires</li>
                        <li>Informations financières (loyers, charges)</li>
                        <li>Documents liés à la gestion (baux, quittances)</li>
                      </ul>

                      <h3 className="text-xl font-semibold text-foreground">Données techniques</h3>
                      <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                        <li>Adresse IP</li>
                        <li>Données de navigation (cookies)</li>
                        <li>Logs de connexion</li>
                      </ul>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Finalités du traitement</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p><strong>Gestion du service :</strong> Fourniture des fonctionnalités de gestion locative</p>
                      <p><strong>Support client :</strong> Assistance technique et réponse aux demandes</p>
                      <p><strong>Facturation :</strong> Gestion des abonnements et paiements</p>
                      <p><strong>Communication :</strong> Envoi d'informations sur le service (avec consentement)</p>
                      <p><strong>Sécurité :</strong> Protection contre les fraudes et les utilisations abusives</p>
                      <p><strong>Amélioration du service :</strong> Analyse d'usage anonymisée</p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Base légale</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p><strong>Exécution du contrat :</strong> Traitement nécessaire à la fourniture du service</p>
                      <p><strong>Intérêt légitime :</strong> Amélioration du service, sécurité</p>
                      <p><strong>Consentement :</strong> Communications marketing, cookies non essentiels</p>
                      <p><strong>Obligation légale :</strong> Conservation des données comptables</p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Destinataires des données</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p><strong>Personnel autorisé :</strong> Équipe BailloGenius (accès strictement nécessaire)</p>
                      <p><strong>Prestataires techniques :</strong> Hébergement (OVH, France), paiement (Stripe)</p>
                      <p><strong>Autorités :</strong> Uniquement en cas d'obligation légale</p>
                      <p className="font-semibold text-foreground">
                        ❌ Aucune vente ou cession de données à des tiers
                      </p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Durée de conservation</h2>
                    <div className="space-y-3 text-muted-foreground">
                      <p><strong>Données du compte :</strong> Durée de l'abonnement + 3 ans</p>
                      <p><strong>Données de gestion :</strong> Durée nécessaire + archivage légal</p>
                      <p><strong>Données comptables :</strong> 10 ans (obligation légale)</p>
                      <p><strong>Logs techniques :</strong> 12 mois maximum</p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">7. Sécurité des données</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Lock className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Chiffrement</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          SSL/TLS pour les transmissions, chiffrement AES-256 pour le stockage
                        </p>
                      </div>
                      
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Shield className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Hébergement</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Serveurs sécurisés en France (OVH), certifiés ISO 27001
                        </p>
                      </div>
                      
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Eye className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Accès</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Authentification à deux facteurs, accès limité au personnel
                        </p>
                      </div>
                      
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Trash2 className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Sauvegarde</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Sauvegardes chiffrées quotidiennes, plan de continuité d'activité
                        </p>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">8. Vos droits</h2>
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-foreground mb-2">🔍 Droit d'accès</h3>
                        <p className="text-sm text-muted-foreground">
                          Vous pouvez demander une copie de toutes vos données personnelles
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-foreground mb-2">✏️ Droit de rectification</h3>
                        <p className="text-sm text-muted-foreground">
                          Vous pouvez corriger ou mettre à jour vos informations
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-foreground mb-2">🗑️ Droit à l'effacement</h3>
                        <p className="text-sm text-muted-foreground">
                          Vous pouvez demander la suppression de vos données (sous conditions)
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-foreground mb-2">📱 Droit à la portabilité</h3>
                        <p className="text-sm text-muted-foreground">
                          Vous pouvez récupérer vos données dans un format structuré
                        </p>
                      </div>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="font-semibold text-foreground mb-2">⛔ Droit d'opposition</h3>
                        <p className="text-sm text-muted-foreground">
                          Vous pouvez vous opposer au traitement (marketing, profilage)
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mt-6">
                      <strong>Comment exercer vos droits :</strong> Contactez-nous à {siteConfig.contactEmail} 
                      avec une pièce d'identité. Nous répondons sous 30 jours maximum.
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">9. Cookies</h2>
                    <div className="space-y-4 text-muted-foreground leading-relaxed">
                      <p><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement (authentification, sécurité)</p>
                      <p><strong>Cookies analytiques :</strong> Mesure d'audience anonyme (avec consentement)</p>
                      <p><strong>Gestion :</strong> Vous pouvez modifier vos préférences via le bandeau cookies</p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">10. Transferts internationaux</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Vos données sont hébergées exclusivement en France. Certains prestataires (Stripe pour les paiements) 
                      peuvent traiter des données aux États-Unis avec des garanties appropriées (clauses contractuelles types).
                    </p>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">11. Contact et réclamations</h2>
                    <div className="text-muted-foreground leading-relaxed space-y-4">
                      <p>
                        <strong>Délégué à la Protection des Données :</strong> {siteConfig.contactEmail}
                      </p>
                      <p>
                        <strong>Autorité de contrôle :</strong> En cas de désaccord, vous pouvez saisir la CNIL 
                        (Commission Nationale de l'Informatique et des Libertés) sur <a href="https://www.cnil.fr" className="text-primary hover:underline">cnil.fr</a>
                      </p>
                    </div>
                  </section>

                  <Separator />

                  <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">12. Modifications</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Cette politique peut être modifiée pour refléter les évolutions légales ou de nos services. 
                      Nous vous informerons de tout changement significatif par email ou notification dans l'application.
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