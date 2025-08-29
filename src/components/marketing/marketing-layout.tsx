import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  Home,
  Star,
  Calculator,
  HelpCircle,
  FileText,
  Phone,
  Info
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Fonctionnalités", href: "/features", icon: Star },
  { name: "Tarifs", href: "/offers", icon: Calculator },
  { name: "FAQ", href: "/faq", icon: HelpCircle },
  { name: "Ressources", href: "/resources", icon: FileText },
  { name: "À propos", href: "/about", icon: Info },
  { name: "Contact", href: "/contact", icon: Phone },
];

export function MarketingLayout({ children }: MarketingLayoutProps) {
  console.log('📄 MarketingLayout loading correctly!', { pathname: window.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="rounded-lg bg-gradient-primary p-2">
                <Home className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {siteConfig.name}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive(item.href)
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center space-x-3">
              {/* <Button variant="ghost" asChild>
                <a href={`${siteConfig.appUrl}/sign-in`}>
                  Se connecter
                </a>
              </Button> */}
              <Button className="w-full justify-start" asChild>
                <Link to="/app">Accéder à l'application</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col space-y-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t border-border space-y-2">
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <a href={`${siteConfig.appUrl}/sign-in`}>
                      Se connecter
                    </a>
                  </Button>
                  <Button className="w-full justify-start" asChild>
                    <a href={siteConfig.appUrl}>
                      Accéder à l'application
                    </a>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-gradient-primary p-2">
                  <Home className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">
                  {siteConfig.name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {siteConfig.description}
              </p>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  RGPD
                </Button>
                <Button variant="outline" size="sm">
                  Hébergement UE
                </Button>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Produit</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features" className="hover:text-foreground">Fonctionnalités</Link></li>
                <li><Link to="/offers" className="hover:text-foreground">Tarifs</Link></li>
                <li><Link to="/changelog" className="hover:text-foreground">Nouveautés</Link></li>
                <li><a href={siteConfig.appUrl} className="hover:text-foreground">Démo</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Ressources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/resources" className="hover:text-foreground">Blog</Link></li>
                <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
                <li><Link to="/about" className="hover:text-foreground">À propos</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Légal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/legal/terms" className="hover:text-foreground">CGU</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-foreground">Confidentialité</Link></li>
                <li><Link to="/legal/imprint" className="hover:text-foreground">Mentions légales</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2024 {siteConfig.company.name}. Tous droits réservés.
            </p>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <a href={siteConfig.social.linkedin} target="_blank" rel="noopener">
                  LinkedIn
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={siteConfig.social.twitter} target="_blank" rel="noopener">
                  Twitter
                </a>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}