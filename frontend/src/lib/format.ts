// Utilitaires de formatage pour l'affichage des données

// Formatage monétaire français
export function formatCurrency(amount: number, options?: { 
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
}): string {
  const { 
    minimumFractionDigits = 0, 
    maximumFractionDigits = 0,
    showSymbol = true
  } = options || {};

  const formatter = new Intl.NumberFormat('fr-FR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(amount);
}

// Formatage des pourcentages
export function formatPercentage(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  const { minimumFractionDigits = 1, maximumFractionDigits = 2 } = options || {};
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
}

// Formatage des nombres sans unité
export function formatNumber(value: number, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options || {};
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

// Formatage compact pour les grands nombres
export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M€`;
  } else if (Math.abs(amount) >= 1000) {
    return `${(amount / 1000).toFixed(1)}k€`;
  }
  return formatCurrency(amount);
}

// Conversion des durées
export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) {
    return `${remainingMonths} mois`;
  } else if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  } else {
    return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
  }
}

// Formatage des valeurs d'input monétaires
export function parseInputCurrency(value: string): number {
  // Supprimer les espaces, points et symboles monétaires
  const cleaned = value.replace(/[€\s\.]/g, '').replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
}

// Formatage pour l'affichage dans les inputs
export function formatInputCurrency(value: number): string {
  if (value === 0) return '';
  return value.toString().replace('.', ',');
}