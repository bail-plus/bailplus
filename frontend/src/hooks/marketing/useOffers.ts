import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Offer = {
  id: number;                 // garde number si ta table est SERIAL; sinon string si UUID
  name: string;
  price: string;
  period?: string | null;
  description: string;
  features: string[];         // toujours un tableau côté UI
  max_properties: string;
  popular?: boolean | null;
};

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string') {
    // string JSON ou CSV
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === 'string');
    } catch {
      // CSV fallback
      if (v.includes(';')) return v.split(';').map(s => s.trim()).filter(Boolean);
      if (v.includes(',')) return v.split(',').map(s => s.trim()).filter(Boolean);
      return [v];
    }
  }
  return [];
}

async function fetchOffers(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('id, name, price, period, description, features, max_properties, popular');

  console.log('[offers] raw supabase response →', { data, error }); // 👈 debug

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    period: row.period ?? null,
    description: row.description,
    features: toStringArray(row.features), // ✅ ne force plus à []
    max_properties: row.max_properties,
    popular: row.popular ?? null,
  })) as Offer[];
}

export function useOffers() {
  return useQuery({
    queryKey: ['offers'],
    queryFn: fetchOffers,
    staleTime: 5 * 60 * 1000,
  });
}
