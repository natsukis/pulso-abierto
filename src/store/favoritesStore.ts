// Estado global de favoritos: lo usan el listado, el detalle y el encabezado.
// Es lo único que se guarda en el almacenamiento local; carga, error y resultados quedan fuera.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { isCoinId } from '../data/catalog';
import type { CoinId } from '../types/crypto';

export const FAVORITES_STORAGE_KEY = 'pulso-abierto:favoritos';

export interface FavoritesState {
  favoriteIds: CoinId[];
  /** Agrega el id si no es favorito y lo quita si ya lo es. */
  toggleFavorite: (id: CoinId) => void;
}

type PersistedFavorites = Pick<FavoritesState, 'favoriteIds'>;

/**
 * Lo guardado puede haberse editado a mano o provenir de otra versión: solo se recuperan
 * identificadores admitidos y sin repetir.
 */
function readFavoriteIds(persisted: unknown): CoinId[] {
  if (typeof persisted !== 'object' || persisted === null || !('favoriteIds' in persisted)) {
    return [];
  }
  const { favoriteIds } = persisted;
  if (!Array.isArray(favoriteIds)) return [];
  const valid = favoriteIds.filter(
    (id): id is CoinId => typeof id === 'string' && isCoinId(id),
  );
  return [...new Set(valid)];
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      favoriteIds: [],
      // Actualización inmutable: se crea un arreglo nuevo, nunca se modifica el anterior.
      toggleFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id)
            ? state.favoriteIds.filter((item) => item !== id)
            : [...state.favoriteIds, id],
        })),
    }),
    {
      name: FAVORITES_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Explícito: solo se persiste la colección de ids.
      partialize: (state): PersistedFavorites => ({ favoriteIds: state.favoriteIds }),
      merge: (persisted, current) => ({ ...current, favoriteIds: readFavoriteIds(persisted) }),
    },
  ),
);

// Selectores: cada componente se suscribe solo a lo que necesita.
export const selectIsFavorite = (id: CoinId) => (state: FavoritesState) =>
  state.favoriteIds.includes(id);
export const selectFavoriteIds = (state: FavoritesState) => state.favoriteIds;
/** La cantidad se deriva de la colección: no es otro estado. */
export const selectFavoriteCount = (state: FavoritesState) => state.favoriteIds.length;
export const selectToggleFavorite = (state: FavoritesState) => state.toggleFavorite;
