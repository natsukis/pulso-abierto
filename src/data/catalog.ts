import type { CoinId, CoinInfo, Currency, QueryMode } from '../types/crypto';

/** Criptomonedas que admite la aplicación. El orden define el orden del listado. */
export const COINS: readonly CoinInfo[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    launchYear: 2009,
    description:
      'Primera criptomoneda descentralizada. Se usa como medio de intercambio y como reserva de valor; su red se sostiene mediante prueba de trabajo.',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    launchYear: 2015,
    description:
      'Plataforma para ejecutar contratos inteligentes y aplicaciones descentralizadas. Ether (ETH) se usa para pagar las operaciones de la red.',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    launchYear: 2020,
    description:
      'Red orientada a operaciones rápidas y de bajo costo. SOL se utiliza para pagar comisiones y para participar en la validación de la red.',
  },
];

export const CURRENCY_LABELS: Record<Currency, string> = {
  usd: 'Dólar estadounidense (USD)',
  eur: 'Euro (EUR)',
  ars: 'Peso argentino (ARS)',
};

export const MODE_LABELS: Record<QueryMode, string> = {
  real: 'Consulta real a la API',
  demora: 'Simular demora de 3 segundos',
  vacio: 'Simular respuesta sin resultados',
  error: 'Simular error del servicio',
};

export function isCoinId(value: string | undefined): value is CoinId {
  return COINS.some((coin) => coin.id === value);
}

export function findCoin(id: CoinId): CoinInfo {
  const coin = COINS.find((item) => item.id === id);
  if (!coin) throw new Error(`Criptomoneda no registrada: ${id}`);
  return coin;
}
