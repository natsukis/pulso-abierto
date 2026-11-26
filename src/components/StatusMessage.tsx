import type { ReactNode } from 'react';
import type { RequestStatus } from '../types/crypto';

interface StatusContent {
  icon: string;
  label: string;
}

// El ícono y la etiqueta en texto acompañan al color: el estado no depende solo de él.
const STATUS_CONTENT: Record<RequestStatus, StatusContent> = {
  inicial: { icon: 'ℹ', label: 'Sin consultar:' },
  carga: { icon: '', label: 'Cargando:' },
  resultado: { icon: '✓', label: 'Consulta completada:' },
  vacío: { icon: '∅', label: 'Sin resultados:' },
  error: { icon: '!', label: 'Error:' },
};

interface StatusMessageProps {
  status: RequestStatus;
  message: ReactNode;
  /** Si se indica, el estado de error ofrece un botón para volver a intentar. */
  onRetry?: () => void;
}

/** Comunica el estado de una operación. La región se mantiene montada para que se anuncie. */
export function StatusMessage({ status, message, onRetry }: StatusMessageProps) {
  const content = STATUS_CONTENT[status];

  return (
    <>
      <div className="status" role="status" aria-live="polite" data-state={status}>
        <span className="status__icon" aria-hidden="true">
          {content.icon}
        </span>
        <p className="status__text">
          <strong className="status__label">{content.label}</strong> {message}
        </p>
      </div>

      {status === 'error' && onRetry && (
        <button className="button button--secondary" type="button" onClick={onRetry}>
          Reintentar la consulta
        </button>
      )}
    </>
  );
}
