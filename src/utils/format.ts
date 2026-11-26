// Funciones de formato y comparación. No usan estado ni efectos: son funciones comunes.
import type { CoinInfo, Currency } from '../types/crypto';

const locale = navigator.language || 'es-AR';

export function formatPrice(value: number, currency: Currency): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Montos grandes en notación abreviada (por ejemplo, «1,6 B US$»). */
export function formatCompactPrice(value: number, currency: Currency): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

/** Variación porcentual con signo explícito: «+3,42 %» o «−1,10 %». */
export function formatChange(value: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    signDisplay: 'exceptZero',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/** Minúsculas y sin tildes, para comparar textos sin importar cómo se escribieron. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Indica si una criptomoneda coincide con el texto buscado (por nombre o símbolo). */
export function matchesSearch(coin: CoinInfo, search: string): boolean {
  const term = normalize(search.trim());
  if (term === '') return true;
  return normalize(coin.name).includes(term) || normalize(coin.symbol).includes(term);
}
