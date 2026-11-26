// D. Servicio: se simula fetch; nunca se consulta la API real.
import { describe, expect, it, vi } from 'vitest';
import { detailResponse, jsonResponse, simplePriceResponse } from '../test/fixtures';
import { ApiError, fetchCoinDetail, fetchPrices, isAbortError } from './coingecko';

describe('servicio de CoinGecko', () => {
  it('con una respuesta exitosa consulta /simple/price y adapta los datos al modelo de la aplicación', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(simplePriceResponse));
    vi.stubGlobal('fetch', fetchMock);

    const prices = await fetchPrices('usd');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd',
    );
    expect(prices.map((coin) => coin.id)).toEqual(['bitcoin', 'ethereum', 'solana']);
    expect(prices[0]).toEqual({
      id: 'bitcoin',
      name: 'Bitcoin',
      symbol: 'BTC',
      launchYear: 2009,
      description: expect.any(String),
      price: 80258,
      change24h: 3.42,
    });
  });

  it('devuelve una colección vacía si la API no incluye ninguna moneda', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({})));

    await expect(fetchPrices('usd')).resolves.toEqual([]);
  });

  it('con ok: false lanza un ApiError con un mensaje comprensible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'fallo' }, 503)));

    const error = await fetchPrices('usd').catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 503 });
    expect((error as ApiError).userMessage).toMatch(/no está disponible en este momento/);
  });

  it('explica el límite de consultas cuando la API responde 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 429)));

    await expect(fetchPrices('usd')).rejects.toMatchObject({
      userMessage: expect.stringMatching(/demasiadas consultas/),
    });
  });

  it('rechaza una respuesta con una estructura inesperada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ bitcoin: { usd: 'mucho' } })));

    await expect(fetchPrices('usd')).rejects.toMatchObject({
      userMessage: 'La respuesta del servicio no tiene el formato esperado.',
    });
  });

  it('adapta el detalle: precios por moneda, indicadores y fecha de actualización', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(detailResponse)));

    const detail = await fetchCoinDetail('bitcoin');

    expect(detail).toMatchObject({
      id: 'bitcoin',
      prices: { usd: 80258, eur: 71418, ars: 124374643 },
      change24h: 3.42,
      marketCapUsd: 1613778510464.14,
      volume24hUsd: 38201150830.69,
    });
    expect(detail?.lastUpdated).toEqual(new Date(1793813893 * 1000));
  });

  it('cancela la solicitud cuando se activa la señal y no lo trata como un error para mostrar', async () => {
    // fetch simulado que, como el real, rechaza con AbortError al cancelarse.
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('The operation was aborted.', 'AbortError')),
          );
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const request = fetchPrices('usd', 'real', { signal: controller.signal });
    controller.abort();
    const error = await request.catch((reason: unknown) => reason);

    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
    expect(isAbortError(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ApiError);
  });
});
