import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { CURRENCY_LABELS, MODE_LABELS } from '../data/catalog';
import {
  getFieldErrors,
  queryCriteriaSchema,
  SEARCH_MIN_LENGTH,
  type QueryCriteria,
  type QueryFormErrors,
  type QueryFormValues,
} from '../schemas/queryCriteria';
import { CURRENCIES, QUERY_MODES } from '../types/crypto';

interface QueryFormProps {
  /** Valores con los que se completa el formulario (los de la URL, si existen). */
  initialValues: QueryFormValues;
  initialErrors?: QueryFormErrors;
  /** Se invoca solo con criterios válidos. */
  onSubmit: (criteria: QueryCriteria) => void;
  busy: boolean;
}

/** Controles de consulta: formulario controlado y validado con Zod. */
export function QueryForm({ initialValues, initialErrors = {}, onSubmit, busy }: QueryFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState(initialErrors);

  // Si la URL cambia desde afuera (atrás/adelante del navegador), el formulario se sincroniza.
  const initialKey = JSON.stringify(initialValues);
  const [syncedKey, setSyncedKey] = useState(initialKey);
  if (syncedKey !== initialKey) {
    setSyncedKey(initialKey);
    setValues(initialValues);
    setErrors(initialErrors);
  }

  // Referencias para llevar el foco al primer campo con error (acción imperativa legítima).
  const searchRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLSelectElement>(null);
  const modeRef = useRef<HTMLSelectElement>(null);

  function focusField(field: keyof QueryFormValues) {
    const refs = { search: searchRef, currency: currencyRef, mode: modeRef };
    refs[field].current?.focus();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = queryCriteriaSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors = getFieldErrors(result.error);
      setErrors(fieldErrors);
      const firstInvalid = (['search', 'currency', 'mode'] as const).find((field) => fieldErrors[field]);
      if (firstInvalid) focusField(firstInvalid);
      return;
    }

    setErrors({});
    onSubmit(result.data);
  }

  /** Atributos de accesibilidad comunes a cada control. */
  function a11yProps(field: keyof QueryFormValues, hintId: string) {
    const errorId = `${field}-error`;
    return {
      'aria-invalid': errors[field] ? true : undefined,
      'aria-describedby': errors[field] ? `${errorId} ${hintId}` : hintId,
    };
  }

  function renderError(field: keyof QueryFormValues) {
    if (!errors[field]) return null;
    return (
      <p id={`${field}-error`} className="field-error">
        <span aria-hidden="true">⚠ </span>
        <strong>Error:</strong> {errors[field]}
      </p>
    );
  }

  return (
    <form className="query-form" onSubmit={handleSubmit} noValidate aria-label="Consulta de precios">
      <div className={`field${errors.search ? ' field--invalid' : ''}`}>
        <label htmlFor="search">Buscar por nombre o símbolo</label>
        <input
          ref={searchRef}
          id="search"
          name="search"
          type="search"
          autoComplete="off"
          value={values.search}
          onChange={handleChange}
          {...a11yProps('search', 'search-hint')}
        />
        {renderError('search')}
        <p id="search-hint" className="hint">
          Por ejemplo «bit» o «eth». Mínimo {SEARCH_MIN_LENGTH} caracteres; vacío muestra las tres.
        </p>
      </div>

      <div className={`field${errors.currency ? ' field--invalid' : ''}`}>
        <label htmlFor="currency">Moneda de cotización</label>
        <select
          ref={currencyRef}
          id="currency"
          name="currency"
          value={values.currency}
          onChange={handleChange}
          {...a11yProps('currency', 'currency-hint')}
        >
          <option value="">— Elegí una moneda —</option>
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {CURRENCY_LABELS[currency]}
            </option>
          ))}
        </select>
        {renderError('currency')}
        <p id="currency-hint" className="hint">
          Moneda en la que se expresan los precios.
        </p>
      </div>

      <div className={`field${errors.mode ? ' field--invalid' : ''}`}>
        <label htmlFor="mode">Modo de prueba de estados</label>
        <select
          ref={modeRef}
          id="mode"
          name="mode"
          value={values.mode}
          onChange={handleChange}
          {...a11yProps('mode', 'mode-hint')}
        >
          <option value="">— Elegí un modo —</option>
          {QUERY_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {MODE_LABELS[mode]}
            </option>
          ))}
        </select>
        {renderError('mode')}
        <p id="mode-hint" className="hint">
          Permite observar los estados de carga, vacío y error. Tras el error simulado,
          «Reintentar» consulta la API real.
        </p>
      </div>

      <div className="form-actions">
        <button className="button button--primary" type="submit" aria-describedby="submit-hint">
          {busy ? 'Consultando…' : 'Consultar precios'}
        </button>
        <p id="submit-hint" className="hint">
          Consultar con los mismos criterios actualiza los precios.
        </p>
      </div>
    </form>
  );
}
