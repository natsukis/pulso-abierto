import type { CoinPrice, Currency } from '../types/crypto';
import { CoinCard } from './CoinCard';

interface CoinListProps {
  coins: readonly CoinPrice[];
  currency: Currency;
  listSearch: string;
}

/** Colección de resultados: una tarjeta por criptomoneda, con el id como clave estable. */
export function CoinList({ coins, currency, listSearch }: CoinListProps) {
  return (
    <ul className="card-grid" aria-label={`Precios de criptomonedas en ${currency.toUpperCase()}`}>
      {coins.map((coin) => (
        <li key={coin.id}>
          <CoinCard coin={coin} currency={currency} listSearch={listSearch} />
        </li>
      ))}
    </ul>
  );
}
