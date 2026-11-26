import { useMemo } from 'react';
import { fetchCoinDetail } from '../services/coingecko';
import type { CoinId } from '../types/crypto';
import { useRemoteData } from './useRemoteData';

/** Coordina la consulta del detalle de una criptomoneda identificada en la URL. */
export function useCoinDetail(id: CoinId | null) {
  const load = useMemo(
    () => (id ? (_attempt: number, signal: AbortSignal) => fetchCoinDetail(id, { signal }) : null),
    [id],
  );
  const { data, ...state } = useRemoteData(load, (detail) => detail === null);
  return { ...state, detail: data };
}
