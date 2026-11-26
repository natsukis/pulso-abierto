import { useMemo } from 'react';
import { fetchPrices } from '../services/coingecko';
import type { Currency, QueryMode } from '../types/crypto';
import { useRemoteData } from './useRemoteData';

export interface PricesRequest {
  currency: Currency;
  mode: QueryMode;
}

/** Coordina la consulta de precios del listado según los criterios aplicados. */
export function usePrices(request: PricesRequest | null) {
  const currency = request?.currency;
  const mode = request?.mode;

  // Una función nueva solo cuando cambian moneda o modo: eso define una consulta nueva.
  const load = useMemo(() => {
    if (!currency || !mode) return null;
    // El modo «error» simula una falla transitoria: el reintento consulta la API real.
    return (attempt: number, signal: AbortSignal) =>
      fetchPrices(currency, mode === 'error' && attempt > 0 ? 'real' : mode, { signal });
  }, [currency, mode]);

  const { data, ...state } = useRemoteData(load, (prices) => prices.length === 0);
  return { ...state, prices: data ?? [] };
}
