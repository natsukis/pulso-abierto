// Store de favoritos: actualización inmutable y persistencia selectiva.
import { describe, expect, it } from 'vitest';
import { FAVORITES_STORAGE_KEY, useFavoritesStore } from './favoritesStore';

function storedValue() {
  const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
  return raw === null ? null : JSON.parse(raw);
}

describe('store de favoritos', () => {
  it('agrega y quita un favorito sin modificar el arreglo anterior', () => {
    const initial = useFavoritesStore.getState().favoriteIds;

    useFavoritesStore.getState().toggleFavorite('solana');
    const afterAdd = useFavoritesStore.getState().favoriteIds;
    useFavoritesStore.getState().toggleFavorite('solana');

    expect(initial).toEqual([]);
    expect(afterAdd).toEqual(['solana']);
    expect(afterAdd).not.toBe(initial);
    expect(useFavoritesStore.getState().favoriteIds).toEqual([]);
  });

  it('guarda solo los identificadores en el almacenamiento local, también al desmarcar', () => {
    useFavoritesStore.getState().toggleFavorite('bitcoin');
    useFavoritesStore.getState().toggleFavorite('ethereum');
    expect(storedValue()).toEqual({ state: { favoriteIds: ['bitcoin', 'ethereum'] }, version: 0 });

    useFavoritesStore.getState().toggleFavorite('bitcoin');
    expect(storedValue()).toEqual({ state: { favoriteIds: ['ethereum'] }, version: 0 });
  });

  it('recupera los favoritos guardados y descarta valores no admitidos', async () => {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({ state: { favoriteIds: ['bitcoin', 'dogecoin', 'bitcoin', 3] }, version: 0 }),
    );

    await useFavoritesStore.persist.rehydrate();

    expect(useFavoritesStore.getState().favoriteIds).toEqual(['bitcoin']);
  });
});
