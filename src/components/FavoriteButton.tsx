import { selectIsFavorite, selectToggleFavorite, useFavoritesStore } from '../store/favoritesStore';
import type { CoinId } from '../types/crypto';

interface FavoriteButtonProps {
  coinId: CoinId;
  coinName: string;
}

/** Botón conmutador de favorito. Se usa en las tarjetas del listado y en la página de detalle. */
export function FavoriteButton({ coinId, coinName }: FavoriteButtonProps) {
  const isFavorite = useFavoritesStore(selectIsFavorite(coinId));
  const toggleFavorite = useFavoritesStore(selectToggleFavorite);

  return (
    <button
      className="button button--toggle"
      type="button"
      // El nombre accesible empieza con el texto visible y agrega la moneda.
      aria-label={`Favorita: ${coinName}`}
      aria-pressed={isFavorite}
      onClick={() => toggleFavorite(coinId)}
    >
      <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span> Favorita
    </button>
  );
}
