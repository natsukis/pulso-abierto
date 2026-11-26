// Consulta vigente: al cambiar los criterios se cancela la solicitud anterior y su resultado
// no reemplaza al de la consulta nueva (caso sugerido durante el diagnóstico).
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { fetchPrices } from '../services/coingecko';
import { deferred, samplePrices } from '../test/fixtures';
import type { CoinPrice } from '../types/crypto';
import { usePrices, type PricesRequest } from './usePrices';

vi.mock('../services/coingecko', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/coingecko')>();
  return { ...actual, fetchPrices: vi.fn() };
});

describe('usePrices', () => {
  it('cancela la consulta anterior y muestra solo el resultado de la vigente', async () => {
    const usd = deferred<CoinPrice[]>();
    const eur = deferred<CoinPrice[]>();
    vi.mocked(fetchPrices).mockReturnValueOnce(usd.promise).mockReturnValueOnce(eur.promise);
    const eurPrices = samplePrices.map((coin) => ({ ...coin, price: coin.price * 0.9 }));

    const { result, rerender } = renderHook(({ request }) => usePrices(request), {
      initialProps: { request: { currency: 'usd', mode: 'real' } as PricesRequest },
    });
    expect(result.current.status).toBe('carga');

    rerender({ request: { currency: 'eur', mode: 'real' } });
    const firstSignal = vi.mocked(fetchPrices).mock.calls[0][2]?.signal;
    expect(firstSignal?.aborted).toBe(true);

    // La respuesta de USD llega tarde: no debe mostrarse.
    await act(async () => usd.resolve(samplePrices));
    expect(result.current.status).toBe('carga');

    await act(async () => eur.resolve(eurPrices));
    await waitFor(() => expect(result.current.status).toBe('resultado'));
    expect(result.current.prices).toEqual(eurPrices);
  });
});
