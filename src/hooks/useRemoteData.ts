import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, isAbortError } from '../services/coingecko';
import type { RequestStatus } from '../types/crypto';

/**
 * Función que realiza una solicitud. Recibe el número de reintento (0 en el primer intento)
 * y una señal para cancelarla.
 */
export type Loader<T> = (attempt: number, signal: AbortSignal) => Promise<T>;

type RemoteResponse<T> =
  | { source: Loader<T>; attempt: number; ok: true; data: T; receivedAt: Date }
  | { source: Loader<T>; attempt: number; ok: false; message: string };

/**
 * Lógica común de las consultas externas:
 * - inicia la solicitud cuando cambia `load` (o al reintentar), nunca durante el renderizado;
 * - cancela la solicitud anterior en la limpieza del efecto y descarta su resultado;
 * - deriva el estado (inicial, carga, resultado, vacío, error) a partir de la última respuesta.
 *
 * `load` debe estar memorizada (useMemo/useCallback): una función nueva representa una consulta
 * nueva. Con `null` todavía no hay nada que consultar.
 */
export function useRemoteData<T>(load: Loader<T> | null, isEmpty: (data: T) => boolean) {
  // Los reintentos se cuentan por consulta: al cambiar `load`, el contador vuelve a 0.
  const [retries, setRetries] = useState({ source: load, count: 0 });
  const attempt = retries.source === load ? retries.count : 0;

  const [response, setResponse] = useState<RemoteResponse<T> | null>(null);

  useEffect(() => {
    if (!load) return;

    // La señal cumple dos funciones: cancela la solicitud HTTP en curso y marca su resultado
    // como obsoleto. Se activa en la limpieza: al cambiar la consulta, al desmontar la vista
    // y en el doble montaje que StrictMode hace en desarrollo.
    const controller = new AbortController();

    load(attempt, controller.signal).then(
      (data) => {
        if (controller.signal.aborted) return;
        setResponse({ source: load, attempt, ok: true, data, receivedAt: new Date() });
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        console.error('[Pulso Abierto] Falló la consulta:', error);
        setResponse({ source: load, attempt, ok: false, message: getErrorMessage(error) });
      },
    );

    return () => controller.abort();
  }, [load, attempt]);

  const retry = useCallback(() => {
    setRetries((prev) => ({ source: load, count: (prev.source === load ? prev.count : 0) + 1 }));
  }, [load]);

  // Solo cuenta la respuesta que corresponde a la consulta y al intento vigentes.
  const current =
    response !== null && response.source === load && response.attempt === attempt ? response : null;

  let status: RequestStatus;
  if (load === null) status = 'inicial';
  else if (current === null) status = 'carga';
  else if (!current.ok) status = 'error';
  else status = isEmpty(current.data) ? 'vacío' : 'resultado';

  return {
    status,
    data: current?.ok ? current.data : null,
    receivedAt: current?.ok ? current.receivedAt : null,
    errorMessage: current && !current.ok ? current.message : null,
    retry,
  };
}
