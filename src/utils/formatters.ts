/**
 * Format a number as currency (EUR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Format a date string to localized French format
 */
export function formatDate(dateString: string | Date, formatStr: 'short' | 'long' | 'full' = 'short'): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  switch (formatStr) {
    case 'short':
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    case 'long':
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    case 'full':
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    default:
      return date.toLocaleDateString('fr-FR')
  }
}

/**
 * Format a month/year combination
 */
export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Get current month formatted
 */
export function getCurrentMonth(): string {
  return new Date().toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}
