import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingGateProps {
  children: React.ReactNode;
  isLoading: boolean;
  message?: string;
  minDuration?: number; // Minimum loading duration in ms
}

export function LoadingGate({ 
  children, 
  isLoading, 
  message = "Chargement...",
  minDuration = 500 
}: LoadingGateProps) {
  const [showLoading, setShowLoading] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
    } else {
      // Ensure minimum loading duration for better UX
      const timer = setTimeout(() => {
        setShowLoading(false);
      }, minDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, minDuration]);

  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}