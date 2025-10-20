import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/ui/use-toast";
import { 
  Mail, 
  MapPin, 
  MessageCircle, 
  Send,
  Clock,
  Phone,
  HelpCircle,
  Building,
  Users
} from "lucide-react";
import { siteConfig } from "@/config/site";

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  company: z.string().optional(),
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
  type: z.enum(["general", "demo", "support", "enterprise"])
});

type ContactForm = z.infer<typeof contactSchema>;

const contactReasons = [
  {
    value: "demo",
    title: "Demande de démo",
    description: "Vous souhaitez voir BailloGenius en action",
    icon: MessageCircle
  },
  {
    value: "general",
    title: "Question générale",
    description: "Une question sur nos fonctionnalités ou tarifs",
    icon: HelpCircle
  },
  {
    value: "enterprise",
    title: "Offre Entreprise",
    description: "Vous gérez plus de 10 lots ou êtes une SCI",
    icon: Building
  },
  {
    value: "support",
    title: "Support technique",
    description: "Vous êtes client et avez besoin d'aide",
    icon: Users
  }
];

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: "general"
    }
  });

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    
    // Simulate form submission (in real app, send to backend)
    try {
      // Create mailto link with form data
      const subject = `[${data.type.toUpperCase()}] ${data.subject}`;
      const body = `Nom: ${data.name}\nEmail: ${data.email}\n${data.company ? `Société: ${data.company}\n` : ''}\n\nMessage:\n${data.message}`;
      const mailtoLink = `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Open mailto link
      window.location.href = mailtoLink;
      
      toast({
        title: "Message préparé !",
        description: "Votre client email s'ouvre avec le message pré-rempli. Vous pouvez l'envoyer directement.",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12">
      {/* Hero */}
      <section className="py-20 bg-gradient-surface">
        <div className="container mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Contactez{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              notre équipe
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Une question sur BailloGenius ? Besoin d'une démo personnalisée ? 
            Notre équipe est là pour vous accompagner.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <Card className="p-8">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl">Envoyez-nous un message</CardTitle>
                <CardDescription className="text-base">
                  Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Contact Type */}
                  <div className="space-y-3">
                    <Label>Type de demande</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {contactReasons.map((reason) => {
                        const Icon = reason.icon;
                        return (
                          <label
                            key={reason.value}
                            className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                              form.watch("type") === reason.value
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <input
                              type="radio"
                              value={reason.value}
                              {...form.register("type")}
                              className="sr-only"
                            />
                            <Icon className="h-5 w-5 text-primary" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{reason.title}</div>
                              <div className="text-xs text-muted-foreground">{reason.description}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="Votre nom"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        placeholder="votre@email.com"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Company */}
                  <div className="space-y-2">
                    <Label htmlFor="company">Société (optionnel)</Label>
                    <Input
                      id="company"
                      {...form.register("company")}
                      placeholder="Nom de votre société ou SCI"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet *</Label>
                    <Input
                      id="subject"
                      {...form.register("subject")}
                      placeholder="Résumez votre demande en quelques mots"
                    />
                    {form.formState.errors.subject && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.subject.message}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      {...form.register("message")}
                      placeholder="Décrivez votre demande en détail..."
                      rows={6}
                    />
                    {form.formState.errors.message && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Préparation..."
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              {/* Response Time */}
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">Temps de réponse</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Questions générales</span>
                      <span className="font-medium">24h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Demandes de démo</span>
                      <span className="font-medium">Même jour</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Support client</span>
                      <span className="font-medium">24-48h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Direct Contact */}
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Contact direct</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Email</div>
                      <a 
                        href={`mailto:${siteConfig.contactEmail}`}
                        className="text-primary hover:underline"
                      >
                        {siteConfig.contactEmail}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-medium">Siège social</div>
                      <div className="text-muted-foreground">{siteConfig.company.address}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Link */}
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-6 w-6 text-primary" />
                    <CardTitle className="text-lg">Besoin d'aide rapidement ?</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    Consultez notre FAQ pour trouver des réponses immédiates 
                    aux questions les plus courantes.
                  </CardDescription>
                  <Button variant="outline" asChild>
                    <a href="/faq">
                      Consulter la FAQ
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Contact */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Vous préférez nous découvrir d'abord ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Essayez notre démo interactive en 2 minutes, sans inscription
            </p>
            <Button size="lg" asChild>
              <a href={siteConfig.appUrl}>
                Accéder à la démo
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}