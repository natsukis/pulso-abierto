import { Link, useLocation, useParams } from 'react-router';
import { FavoriteButton } from '../components/FavoriteButton';
import { StatusMessage } from '../components/StatusMessage';
import { COINS, CURRENCY_LABELS, findCoin, isCoinId } from '../data/catalog';
import { useCoinDetail } from '../hooks/useCoinDetail';
import { CURRENCIES, type RequestStatus } from '../types/crypto';
import { formatChange, formatCompactPrice, formatDateTime, formatPrice } from '../utils/format';

/** Lee la búsqueda del listado que envía la tarjeta; si se accede directo, no existe. */
function readFromSearch(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'fromSearch' in state) {
    const value = state.fromSearch;
    if (typeof value === 'string' && (value === '' || value.startsWith('?'))) return value;
  }
  return '';
}

/** Página de detalle: se reconstruye solo a partir del identificador de la URL. */
export function CoinDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const coinId = isCoinId(id) ? id : null;
  const { status, detail, errorMessage, retry } = useCoinDetail(coinId);

  const fromSearch = readFromSearch(location.state);
  const backLink = { pathname: '/', search: fromSearch };
  const backLabel = fromSearch ? 'Volver a los resultados' : 'Ir a la consulta de precios';

  if (!coinId) {
    return (
      <>
        <title>Criptomoneda no encontrada · Pulso Abierto</title>
        <section className="panel panel--narrow" aria-labelledby="titulo-detalle">
          <h2 id="titulo-detalle">Criptomoneda no encontrada</h2>
          <p>
            La dirección <code>/criptomonedas/{id}</code> no corresponde a ninguna de las
            criptomonedas que admite Pulso Abierto. Podés consultar:
          </p>
          <ul className="link-list">
            {COINS.map((coin) => (
              <li key={coin.id}>
                <Link to={`/criptomonedas/${coin.id}`}>
                  {coin.name} ({coin.symbol})
                </Link>
              </li>
            ))}
          </ul>
          <Link className="button button--link" to="/">
            Ir a la consulta de precios
          </Link>
        </section>
      </>
    );
  }

  // Los datos fijos del catálogo se muestran aunque la API todavía no haya respondido.
  const coin = findCoin(coinId);
  const messages: Record<RequestStatus, string> = {
    inicial: '',
    carga: `consultando la información de ${coin.name} en CoinGecko…`,
    resultado: `se muestran los datos actuales de ${coin.name}.`,
    vacío: `el servicio no devolvió datos de ${coin.name} en este momento. Intentá más tarde.`,
    error: errorMessage ?? 'no se pudo completar la consulta.',
  };

  return (
    <>
      <title>{`${coin.name} (${coin.symbol}) · Pulso Abierto`}</title>
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <ol>
          <li>
            <Link to={backLink}>Consulta de precios</Link>
          </li>
          <li aria-current="page">{coin.name}</li>
        </ol>
      </nav>

      <article className={`panel detail price-card--${coin.id}`} aria-labelledby="titulo-detalle">
        <header className="detail__header">
          <div className="detail__title-row">
            <h2 id="titulo-detalle" className="price-card__title detail__title">
              {coin.name} <span className="price-card__symbol">{coin.symbol}</span>
            </h2>
            <FavoriteButton coinId={coin.id} coinName={coin.name} />
          </div>
          <p className="detail__description">{coin.description}</p>
          <p className="hint">
            Lanzamiento: {coin.launchYear} · Identificador en CoinGecko: <code>{coin.id}</code>
          </p>
        </header>

        <StatusMessage status={status} message={messages[status]} onRetry={retry} />

        {status === 'resultado' && detail && (
          <dl className="detail__data">
            {CURRENCIES.map((currency) => {
              const price = detail.prices[currency];
              return price === undefined ? null : (
                <div key={currency} className="detail__item">
                  <dt>Precio en {CURRENCY_LABELS[currency]}</dt>
                  <dd>
                    <data value={price}>{formatPrice(price, currency)}</data>
                  </dd>
                </div>
              );
            })}
            {detail.change24h !== null && (
              <div className="detail__item">
                <dt>Variación en 24 h (USD)</dt>
                <dd>{formatChange(detail.change24h)}</dd>
              </div>
            )}
            {detail.marketCapUsd !== null && (
              <div className="detail__item">
                <dt>Capitalización de mercado</dt>
                <dd>{formatCompactPrice(detail.marketCapUsd, 'usd')}</dd>
              </div>
            )}
            {detail.volume24hUsd !== null && (
              <div className="detail__item">
                <dt>Volumen negociado en 24 h</dt>
                <dd>{formatCompactPrice(detail.volume24hUsd, 'usd')}</dd>
              </div>
            )}
            {detail.lastUpdated && (
              <div className="detail__item">
                <dt>Última actualización del dato</dt>
                <dd>
                  <time dateTime={detail.lastUpdated.toISOString()}>
                    {formatDateTime(detail.lastUpdated)}
                  </time>
                </dd>
              </div>
            )}
          </dl>
        )}

        <p className="detail__back">
          <Link className="button button--link" to={backLink}>
            <span aria-hidden="true">← </span>
            {backLabel}
          </Link>
        </p>
      </article>
    </>
  );
}
