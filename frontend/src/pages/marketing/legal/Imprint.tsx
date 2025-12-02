import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "@/config/site";

export default function Imprint() {
  return (
    <div className="py-12">
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Mentions{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Légales
            </span>
          </h1>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8 space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Éditeur du site</h2>
                  <div className="text-muted-foreground space-y-2">
                    <p><strong>Raison sociale :</strong> {siteConfig.company.name}</p>
                    <p><strong>Forme juridique :</strong> Société par Actions Simplifiée (SAS)</p>
                    <p><strong>Adresse :</strong> {siteConfig.company.address}</p>
                    <p><strong>SIRET :</strong> {siteConfig.company.siret}</p>
                    <p><strong>Email :</strong> {siteConfig.contactEmail}</p>
                  </div>
                </section>

                <Separator />

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Hébergement</h2>
                  <div className="text-muted-foreground space-y-2">
                    <p><strong>Hébergeur :</strong> OVH SAS</p>
                    <p><strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France</p>
                    <p><strong>Téléphone :</strong> 1007</p>
                  </div>
                </section>

                <Separator />

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">Propriété intellectuelle</h2>
                  <p className="text-muted-foreground">
                    L'ensemble du contenu de ce site (textes, images, logos, etc.) est protégé par le droit d'auteur. 
                    Toute reproduction, même partielle, est interdite sans autorisation préalable.
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}