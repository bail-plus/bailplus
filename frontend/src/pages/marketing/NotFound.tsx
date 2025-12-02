import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="text-6xl font-bold text-primary mb-4">404</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Page introuvable
        </h1>
        <p className="text-muted-foreground mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Accueil
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
}