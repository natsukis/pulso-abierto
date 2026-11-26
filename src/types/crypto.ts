// Tipos del dominio que usa la aplicación.

/** Identificadores de CoinGecko que admite la aplicación (valores del parámetro `ids`). */
export type CoinId = 'bitcoin' | 'ethereum' | 'solana';

/** Monedas de cotización admitidas (valores del parámetro `vs_currencies`). */
export const CURRENCIES = ['usd', 'eur', 'ars'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Modos de la consulta: real o simulaciones controladas para evidenciar los estados. */
export const QUERY_MODES = ['real', 'demora', 'vacio', 'error'] as const;
export type QueryMode = (typeof QUERY_MODES)[number];

/** Datos fijos de cada criptomoneda: no dependen de la API. */
export interface CoinInfo {
  id: CoinId;
  name: string;
  symbol: string;
  launchYear: number;
  description: string;
}

/** Registro listo para representar en una tarjeta del listado. */
export interface CoinPrice extends CoinInfo {
  price: number;
  /** Variación porcentual de las últimas 24 horas (null si la API no la informa). */
  change24h: number | null;
}

/** Registro con la información ampliada que muestra la página de detalle. */
export interface CoinDetail extends CoinInfo {
  prices: Partial<Record<Currency, number>>;
  change24h: number | null;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  lastUpdated: Date | null;
}

/** Estados posibles de una operación de consulta. */
export type RequestStatus = 'inicial' | 'carga' | 'resultado' | 'vacío' | 'error';
