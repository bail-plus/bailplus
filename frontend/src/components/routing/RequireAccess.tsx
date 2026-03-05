// src/components/routing/RequireAccess.tsx
import { Outlet } from "react-router-dom";

/**
 * Garde neutralisée : ne fait plus AUCUNE navigation.
 * Toute la logique d'accès est centralisée dans AuthenticatedApp.
 */
export default function RequireAccess() {
  return <Outlet />;
}
