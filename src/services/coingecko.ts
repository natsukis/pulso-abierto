// Acceso a la API pública de CoinGecko. Es el único módulo que conoce la dirección de la API
// y los detalles de la solicitud: los componentes reciben datos ya transformados al dominio.
import { z } from 'zod';
import { COINS, findCoin } from '../data/catalog';
import type { CoinDetail, CoinId, CoinPrice, Currency, QueryMode } from '../types/crypto';
import { CURRENCIES } from '../types/crypto';

const API_BASE = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT_MS = 10_000;
const SIMULATED_DELAY_MS = 3_000;

/** Error con un mensaje pensado para mostrar a la persona usuaria. */
export class ApiError extends Error {
  readonly userMessage: string;
  readonly status?: number;

  constructor(userMessage: string, status?: number) {
    super(status ? `HTTP ${status}` : userMessage);
    this.name = 'ApiError';
    this.userMessage = userMessage;
    this.status = status;
  }
}

/** Opciones de las funciones públicas del servicio. */
export interface RequestOptions {
  /** Permite cancelar la solicitud, por ejemplo desde la limpieza de un efecto. */
  signal?: AbortSignal;
}

/** Indica si el error proviene de una cancelación pedida por quien llamó (no es una falla). */
export function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

/** Devuelve un mensaje comprensible para cualquier error de la consulta. */
export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.userMessage
    : 'Ocurrió un problema inesperado. Intentá nuevamente.';
}

/**
 * Forma de la respuesta de `/simple/price`: un objeto por moneda con valores numéricos
 * (`usd`, `usd_24h_change`, `last_updated_at`, …). Algunos valores pueden llegar en null.
 * Si un id no existe, la API simplemente no lo incluye (puede devolver `{}`).
 */
const simplePriceSchema = z.record(z.string(), z.record(z.string(), z.number().nullable()));
type SimplePriceResponse = z.infer<typeof simplePriceSchema>;

function messageForStatus(status: number): string {
  if (status === 429) {
    return 'El servicio recibió demasiadas consultas en poco tiempo. Esperá alrededor de un minuto y volvé a intentar.';
  }
  if (status >= 500) {
    return 'El servicio de precios no está disponible en este momento. Intentá nuevamente en unos instantes.';
  }
  if (status === 404) {
    return 'El servicio no encontró el recurso solicitado (código 404). Intentá nuevamente; si el problema continúa, puede haber cambiado la dirección de la API.';
  }
  return `El servicio no pudo responder la consulta (código ${status}). Intentá nuevamente en unos instantes.`;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

/**
 * Arma la URL de `/simple/price`. Los ids y monedas son valores conocidos, por eso las comas se
 * dejan sin codificar y la URL coincide con la de la documentación.
 */
function buildPriceUrl(
  ids: readonly string[],
  currencies: readonly Currency[],
  extraParams: Record<string, string>,
  endpoint = '/simple/price',
): string {
  const params = [
    `ids=${ids.map(encodeURIComponent).join(',')}`,
    `vs_currencies=${currencies.join(',')}`,
    ...Object.entries(extraParams).map(([key, value]) => `${key}=${encodeURIComponent(value)}`),
  ];
  return `${API_BASE}${endpoint}?${params.join('&')}`;
}

/**
 * Realiza la solicitud a `/simple/price`:
 * - comprueba `response.ok` y lanza ApiError si la respuesta HTTP no es satisfactoria;
 * - procesa el JSON y comprueba su estructura con Zod antes de devolverlo.
 * El parámetro `mode` permite simular demora, respuesta vacía o error con la misma API real.
 */
async function requestSimplePrice(
  ids: readonly string[],
  currencies: readonly Currency[],
  extraParams: Record<string, string>,
  mode: QueryMode,
  signal?: AbortSignal,
): Promise<SimplePriceResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  // La cancelación externa se enlaza con el mismo controlador que aplica el tiempo límite.
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted) cancel();

  // - vacío: un id inexistente hace que CoinGecko responda 200 con un objeto vacío {}.
  // - error: un endpoint inexistente hace que el servicio responda con un error HTTP.
  const requestIds = mode === 'vacio' ? ['moneda-inexistente'] : ids;
  const endpoint = mode === 'error' ? '/simple/precio-inexistente' : '/simple/price';
  const url = buildPriceUrl(requestIds, currencies, extraParams, endpoint);

  try {
    if (mode === 'demora') {
      await wait(SIMULATED_DELAY_MS, controller.signal);
    }

    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(messageForStatus(response.status), response.status);
    }

    const data: unknown = await response.json();
    const parsed = simplePriceSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError('La respuesta del servicio no tiene el formato esperado.');
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (signal?.aborted) {
      // Cancelada por quien la pidió: no es un error para mostrar.
      throw new DOMException('La consulta se canceló.', 'AbortError');
    }
    if (controller.signal.aborted) {
      throw new ApiError(
        'El servicio tardó demasiado en responder. Revisá tu conexión e intentá nuevamente.',
      );
    }
    // fetch rechaza la promesa (TypeError) ante fallas de red. Con CoinGecko también ocurre al
    // superar el límite de consultas: esa respuesta llega sin cabeceras CORS y el navegador no
    // expone el código HTTP (429), solo el fallo de la solicitud.
    throw new ApiError(
      'No se pudo obtener respuesta del servicio de precios. Puede deberse a un problema de conexión o a que el servicio limitó temporalmente las consultas (la API gratuita admite pocas por minuto). Esperá unos segundos e intentá nuevamente.',
    );
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', cancel);
  }
}

/** Precio actual y variación de 24 h de las tres criptomonedas en la moneda indicada. */
export async function fetchPrices(
  currency: Currency,
  mode: QueryMode = 'real',
  { signal }: RequestOptions = {},
): Promise<CoinPrice[]> {
  const data = await requestSimplePrice(
    COINS.map((coin) => coin.id),
    [currency],
    { include_24hr_change: 'true' },
    mode,
    signal,
  );

  return COINS.flatMap((coin) => {
    const entry = data[coin.id];
    const price = entry?.[currency];
    if (typeof price !== 'number') return [];
    return [{ ...coin, price, change24h: entry[`${currency}_24h_change`] ?? null }];
  });
}

/**
 * Información ampliada de una criptomoneda: precio en todas las monedas admitidas,
 * capitalización, volumen y variación en USD. Devuelve null si la API no tiene datos.
 */
export async function fetchCoinDetail(
  id: CoinId,
  { signal }: RequestOptions = {},
): Promise<CoinDetail | null> {
  const data = await requestSimplePrice(
    [id],
    CURRENCIES,
    {
      include_market_cap: 'true',
      include_24hr_vol: 'true',
      include_24hr_change: 'true',
      include_last_updated_at: 'true',
    },
    'real',
    signal,
  );

  const entry = data[id];
  if (!entry || typeof entry.usd !== 'number') return null;

  const prices: Partial<Record<Currency, number>> = {};
  for (const currency of CURRENCIES) {
    const value = entry[currency];
    if (typeof value === 'number') prices[currency] = value;
  }

  const lastUpdatedAt = entry.last_updated_at;
  return {
    ...findCoin(id),
    prices,
    change24h: entry.usd_24h_change ?? null,
    marketCapUsd: entry.usd_market_cap ?? null,
    volume24hUsd: entry.usd_24h_vol ?? null,
    lastUpdated: typeof lastUpdatedAt === 'number' ? new Date(lastUpdatedAt * 1000) : null,
  };
}
