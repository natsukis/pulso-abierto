// Configuración común de las pruebas (se carga antes de cada archivo).
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { useFavoritesStore } from '../store/favoritesStore';

beforeEach(() => {
  // Cada prueba parte sin favoritos ni datos guardados.
  useFavoritesStore.setState({ favoriteIds: [] });
  localStorage.clear();

  // Red de seguridad: si alguna prueba intentara llegar a CoinGecko, falla en lugar de consultar.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('Las pruebas no deben realizar solicitudes reales.'))),
  );
});

afterEach(() => {
  cleanup();
});
