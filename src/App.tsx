import { Link, Navigate, Route, Routes } from 'react-router';
import { CoinDetailPage } from './pages/CoinDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { SearchPage } from './pages/SearchPage';
import { selectFavoriteCount, useFavoritesStore } from './store/favoritesStore';

/** Resumen de favoritos del encabezado: se suscribe solo a la cantidad (dato derivado). */
function FavoritesCount() {
  const count = useFavoritesStore(selectFavoriteCount);
  return (
    <p className="favorites-count">
      <span aria-hidden="true">★ </span>Favoritas guardadas: {count}
    </p>
  );
}

/** Estructura general: encabezado, área principal con las rutas y pie. */
export default function App() {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido principal
      </a>

      <header className="site-header">
        <div className="container">
          <span className="brand" aria-hidden="true">
            <svg className="brand__logo" viewBox="0 0 32 32" width="32" height="32" focusable="false">
              <rect width="32" height="32" rx="8" fill="currentColor" />
              <path
                d="M4 17h6l3-8 5 15 3-7h7"
                fill="none"
                stroke="#fff"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h1 className="site-title">
              <Link to="/">Pulso Abierto</Link>
            </h1>
            <p className="site-description">
              Consultá el precio actual de Bitcoin, Ethereum y Solana en dólares, euros o pesos
              argentinos, con datos públicos de CoinGecko.
            </p>
            <FavoritesCount />
          </div>
        </div>
      </header>

      <main id="contenido" className="container main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/criptomonedas" element={<Navigate to="/" replace />} />
          <Route path="/criptomonedas/:id" element={<CoinDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            Fuente de los datos:{' '}
            <a href="https://www.coingecko.com/en/api" rel="noopener noreferrer" target="_blank">
              API pública de CoinGecko
              <span className="visually-hidden"> (se abre en una pestaña nueva)</span>
            </a>{' '}
            — endpoint <code>/api/v3/simple/price</code>.
          </p>
          <p>
            Pulso Abierto · Desarrollado por Benjamin Natsuki Hokama · Programación Web, Módulo 4.
          </p>
        </div>
      </footer>
    </>
  );
}
