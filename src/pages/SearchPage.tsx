import { useRef } from 'react';
import { useSearchParams } from 'react-router';
import { CoinList } from '../components/CoinList';
import { QueryForm } from '../components/QueryForm';
import { StatusMessage } from '../components/StatusMessage';
import { CURRENCY_LABELS } from '../data/catalog';
import { usePrices } from '../hooks/usePrices';
import { selectFavoriteIds, useFavoritesStore } from '../store/favoritesStore';
import {
  DEFAULT_FORM_VALUES,
  getFieldErrors,
  queryCriteriaSchema,
  type QueryCriteria,
  type QueryFormValues,
} from '../schemas/queryCriteria';
import { CURRENCIES, QUERY_MODES, type RequestStatus } from '../types/crypto';
import { formatTime, matchesSearch } from '../utils/format';

/** Nombres de los parámetros de la URL: /?moneda=usd&busqueda=bit&modo=demora */
const PARAM = { search: 'busqueda', currency: 'moneda', mode: 'modo' } as const;

/** Lee los criterios de la URL como valores de formulario (todavía sin validar). */
function readFormValues(params: URLSearchParams): QueryFormValues {
  const currency = params.get(PARAM.currency) ?? DEFAULT_FORM_VALUES.currency;
  const mode = params.get(PARAM.mode) ?? DEFAULT_FORM_VALUES.mode;
  return {
    search: params.get(PARAM.search) ?? DEFAULT_FORM_VALUES.search,
    // Un valor que no es una opción del selector se muestra como «sin elegir».
    currency: (CURRENCIES as readonly string[]).includes(currency) ? currency : '',
    mode: (QUERY_MODES as readonly string[]).includes(mode) ? mode : '',
  };
}

function toSearchParams(criteria: QueryCriteria): URLSearchParams {
  const params = new URLSearchParams({ [PARAM.currency]: criteria.currency });
  if (criteria.search) params.set(PARAM.search, criteria.search);
  if (criteria.mode !== 'real') params.set(PARAM.mode, criteria.mode);
  return params;
}

/** Página de consulta y resultados. Coordina criterios, datos externos y selección. */
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsTitleRef = useRef<HTMLHeadingElement>(null);

  // La URL es la fuente de verdad de la consulta aplicada: se valida con el mismo esquema.
  const formValues = readFormValues(searchParams);
  const parsed = searchParams.has(PARAM.currency) ? queryCriteriaSchema.safeParse(formValues) : null;
  const criteria = parsed?.success ? parsed.data : null;
  const urlErrors = parsed && !parsed.success ? getFieldErrors(parsed.error) : undefined;

  const { status, prices, receivedAt, errorMessage, retry } = usePrices(
    criteria && { currency: criteria.currency, mode: criteria.mode },
  );

  // Favoritos: estado global (Zustand). La página solo los lee para el resumen.
  const favoriteIds = useFavoritesStore(selectFavoriteIds);

  // Datos derivados: se calculan en cada render a partir de los datos originales.
  const visibleCoins = criteria ? prices.filter((coin) => matchesSearch(coin, criteria.search)) : [];
  const visibleCount = visibleCoins.length;
  const favoriteVisibleCount = visibleCoins.filter((coin) => favoriteIds.includes(coin.id)).length;
  const displayStatus: RequestStatus =
    status === 'resultado' && visibleCount === 0 ? 'vacío' : status;

  function handleSubmit(next: QueryCriteria) {
    const nextParams = toSearchParams(next);
    // Con los mismos criterios la URL no cambia: se repite la solicitud para actualizar precios.
    if (nextParams.toString() === searchParams.toString()) retry();
    else setSearchParams(nextParams);
  }

  function handleRetry() {
    // El botón desaparece al reintentar: el foco pasa al título de resultados para no perderse.
    resultsTitleRef.current?.focus();
    retry();
  }

  function getStatusMessage(): string {
    switch (displayStatus) {
      case 'inicial':
        return urlErrors
          ? 'la dirección contiene criterios no válidos. Revisá los campos marcados en el formulario y volvé a consultar.'
          : 'todavía no se realizó ninguna consulta. Completá los criterios y presioná «Consultar precios».';
      case 'carga':
        return criteria?.mode === 'demora'
          ? 'consultando los precios en CoinGecko (demora simulada de 3 segundos)…'
          : 'consultando los precios en CoinGecko…';
      case 'resultado': {
        const shown = visibleCount === 1 ? 'se muestra 1' : `se muestran ${visibleCount}`;
        const match = criteria?.search ? ` que coinciden con «${criteria.search}»` : '';
        const currency = criteria ? ` en ${CURRENCY_LABELS[criteria.currency]}` : '';
        return `${shown} de ${prices.length} criptomonedas${match}${currency}.`;
      }
      case 'vacío':
        return prices.length === 0
          ? 'la consulta se realizó correctamente, pero el servicio no devolvió precios para mostrar. Probá nuevamente con la consulta real.'
          : `ninguna criptomoneda coincide con «${criteria?.search}». Probá con otro nombre o símbolo, por ejemplo «btc» o «sol».`;
      case 'error':
        return errorMessage ?? 'no se pudo completar la consulta.';
    }
  }

  return (
    <>
      <title>Pulso Abierto · Precios de criptomonedas</title>
      <div className="main-layout">
        <section className="panel" aria-labelledby="titulo-consulta">
          <h2 id="titulo-consulta">Consulta de precios</h2>
          <QueryForm
            initialValues={formValues}
            initialErrors={urlErrors}
            onSubmit={handleSubmit}
            busy={status === 'carga'}
          />
        </section>

        <section className="panel" aria-labelledby="titulo-resultados">
          <div className="results-header">
            <h2 id="titulo-resultados" ref={resultsTitleRef} tabIndex={-1}>
              Resultados
            </h2>
            {displayStatus === 'resultado' && receivedAt && (
              <p className="last-update">
                Actualizado a las{' '}
                <time dateTime={receivedAt.toISOString()}>{formatTime(receivedAt)}</time>
              </p>
            )}
          </div>

          <StatusMessage status={displayStatus} message={getStatusMessage()} onRetry={handleRetry} />

          {displayStatus === 'resultado' && criteria && (
            <>
              <p className="results-summary">
                {favoriteVisibleCount === 0
                  ? 'Usá «Favorita» para guardar una criptomoneda: la selección se conserva al recargar.'
                  : `${favoriteVisibleCount} de ${visibleCount} ${visibleCount === 1 ? 'criptomoneda visible está marcada' : 'criptomonedas visibles están marcadas'} como favorita.`}
              </p>
              <CoinList
                coins={visibleCoins}
                currency={criteria.currency}
                listSearch={searchParams.size > 0 ? `?${searchParams.toString()}` : ''}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
