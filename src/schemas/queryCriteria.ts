import { z } from 'zod';
import { CURRENCIES, QUERY_MODES } from '../types/crypto';

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_MAX_LENGTH = 30;

/** Reglas del formulario de consulta. */
export const queryCriteriaSchema = z.object({
  search: z
    .string()
    .trim()
    .max(SEARCH_MAX_LENGTH, {
      error: `La búsqueda admite hasta ${SEARCH_MAX_LENGTH} caracteres.`,
    })
    .regex(/^[\p{L}\p{N} .-]*$/u, {
      error: 'Usá solo letras, números, espacios, puntos o guiones.',
    })
    .refine((value) => value === '' || value.length >= SEARCH_MIN_LENGTH, {
      error: `Ingresá al menos ${SEARCH_MIN_LENGTH} caracteres (sin contar espacios) o dejá el campo vacío para ver las tres criptomonedas.`,
    }),
  currency: z.enum(CURRENCIES, {
    error: 'Elegí una de las monedas de cotización disponibles.',
  }),
  mode: z.enum(QUERY_MODES, {
    error: 'Elegí uno de los modos de consulta disponibles.',
  }),
});

/** Criterios ya validados: es lo único que se usa para consultar y filtrar. */
export type QueryCriteria = z.infer<typeof queryCriteriaSchema>;

/** Valores temporales del formulario: texto sin validar, tal como lo escribe la persona. */
export type QueryFormValues = Record<keyof QueryCriteria, string>;

export type QueryFormErrors = Partial<Record<keyof QueryCriteria, string>>;

export const DEFAULT_FORM_VALUES: QueryFormValues = { search: '', currency: 'usd', mode: 'real' };

/** Convierte los problemas de Zod en un mensaje por campo (el primero de cada uno). */
export function getFieldErrors(error: z.ZodError): QueryFormErrors {
  const errors: QueryFormErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if ((field === 'search' || field === 'currency' || field === 'mode') && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
