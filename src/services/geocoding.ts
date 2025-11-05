/**
 * Service de géocodage pour convertir des adresses en coordonnées GPS
 * Utilise l'API Adresse du gouvernement français (gratuite, sans clé API)
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  city: string;
  postalCode: string;
  address: string;
  score: number; // Score de confiance (0 à 1)
}

interface AddressApiFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    street?: string;
    name?: string;
    postcode: string;
    citycode: string;
    city: string;
    context: string;
    type: string;
  };
}

interface AddressApiResponse {
  type: string;
  version: string;
  features: AddressApiFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

/**
 * Géocode une adresse complète
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data: AddressApiResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.geometry.coordinates;

    return {
      latitude,
      longitude,
      city: feature.properties.city,
      postalCode: feature.properties.postcode,
      address: feature.properties.label,
      score: feature.properties.score,
    };
  } catch (error) {
    console.error('Erreur lors du géocodage:', error);
    return null;
  }
}

/**
 * Géocode à partir d'un code postal et d'une ville
 */
export async function geocodeFromPostalCode(
  postalCode: string,
  city?: string
): Promise<GeocodingResult | null> {
  try {
    const query = city ? `${postalCode} ${city}` : postalCode;
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=1`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data: AddressApiResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.geometry.coordinates;

    return {
      latitude,
      longitude,
      city: feature.properties.city,
      postalCode: feature.properties.postcode,
      address: feature.properties.label,
      score: feature.properties.score,
    };
  } catch (error) {
    console.error('Erreur lors du géocodage:', error);
    return null;
  }
}

/**
 * Calcule la distance entre deux points GPS en kilomètres (formule de Haversine)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Arrondi à 0.1 km
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Vérifie si un point est dans un rayon donné autour d'un autre point
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
}
