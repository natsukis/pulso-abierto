import { Link } from 'react-router';
import { selectIsFavorite, useFavoritesStore } from '../store/favoritesStore';
import type { CoinPrice, Currency } from '../types/crypto';
import { formatChange, formatPrice } from '../utils/format';
import { FavoriteButton } from './FavoriteButton';

interface CoinCardProps {
  coin: CoinPrice;
  currency: Currency;
  /** Búsqueda actual del listado, para que el detalle pueda volver a la misma vista. */
  listSearch: string;
}

/** Tarjeta reutilizable de una criptomoneda. */
export function CoinCard({ coin, currency, listSearch }: CoinCardProps) {
  // Selector: la tarjeta solo se vuelve a renderizar si cambia el favorito de esta moneda.
  const isFavorite = useFavoritesStore(selectIsFavorite(coin.id));
  const titleId = `card-title-${coin.id}`;
  const trend =
    coin.change24h === null ? null : coin.change24h > 0 ? 'sube' : coin.change24h < 0 ? 'baja' : 'igual';

  return (
    <article
      className={`price-card price-card--${coin.id}${isFavorite ? ' price-card--favorite' : ''}`}
      aria-labelledby={titleId}
    >
      <h3 id={titleId} className="price-card__title">
        {coin.name} <span className="price-card__symbol">{coin.symbol}</span>
        {isFavorite && <span className="price-card__badge">★ Favorita</span>}
      </h3>

      <p className="price-card__label">Precio actual en {currency.toUpperCase()}</p>
      <p className="price-card__value">
        <data value={coin.price}>{formatPrice(coin.price, currency)}</data>
      </p>

      {coin.change24h !== null && (
        <p className={`price-card__change price-card__change--${trend}`}>
          <span aria-hidden="true">{trend === 'sube' ? '▲' : trend === 'baja' ? '▼' : '='}</span>{' '}
          {formatChange(coin.change24h)} en 24 h
        </p>
      )}

      <div className="price-card__actions">
        <Link
          className="button button--link"
          to={`/criptomonedas/${coin.id}`}
          state={{ fromSearch: listSearch }}
          aria-label={`Ver detalle de ${coin.name}`}
        >
          Ver detalle
        </Link>
        <FavoriteButton coinId={coin.id} coinName={coin.name} />
      </div>
    </article>
  );
}
