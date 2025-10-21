
import { PublicNavbar } from './PublicNavbar';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main>{children}</main>
    </div>
  );
}
