// Datos de prueba con la misma forma que las respuestas reales de CoinGecko.
import { COINS, findCoin } from '../data/catalog';
import type { CoinDetail, CoinPrice } from '../types/crypto';

/** Respuesta de /simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true */
export const simplePriceResponse = {
  bitcoin: { usd: 80258, usd_24h_change: 3.42 },
  ethereum: { usd: 2422.07, usd_24h_change: 5.62 },
  solana: { usd: 95.69, usd_24h_change: -2.69 },
};

/** Respuesta de /simple/price para el detalle (tres monedas e indicadores en USD). */
export const detailResponse = {
  bitcoin: {
    usd: 80258,
    usd_market_cap: 1613778510464.14,
    usd_24h_vol: 38201150830.69,
    usd_24h_change: 3.42,
    eur: 71418,
    ars: 124374643,
    last_updated_at: 1793813893,
  },
};

/** Lo que el servicio entrega a la interfaz para el listado. */
export const samplePrices: CoinPrice[] = COINS.map((coin) => ({
  ...coin,
  price: simplePriceResponse[coin.id].usd,
  change24h: simplePriceResponse[coin.id].usd_24h_change,
}));

export const sampleDetail = (id: CoinDetail['id']): CoinDetail => ({
  ...findCoin(id),
  prices: { usd: 100, eur: 90, ars: 150000 },
  change24h: 1.5,
  marketCapUsd: 1_000_000_000,
  volume24hUsd: 50_000_000,
  lastUpdated: new Date('2026-11-12T12:00:00Z'),
});

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Promesa que la prueba resuelve cuando quiere: permite observar el estado de carga. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
