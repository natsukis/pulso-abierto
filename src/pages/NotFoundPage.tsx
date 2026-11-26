import { Link, useLocation } from 'react-router';

/** Página para direcciones que no coinciden con ninguna ruta. */
export function NotFoundPage() {
  const { pathname } = useLocation();

  return (
    <>
      <title>Página no encontrada · Pulso Abierto</title>
      <section className="panel panel--narrow" aria-labelledby="titulo-no-encontrada">
        <p className="not-found__code" aria-hidden="true">
          404
        </p>
        <h2 id="titulo-no-encontrada">Página no encontrada</h2>
        <p>
          La dirección <code>{pathname}</code> no existe en Pulso Abierto. Puede que el enlace esté
          incompleto o que la página se haya movido.
        </p>
        <Link className="button button--link" to="/">
          Ir a la consulta de precios
        </Link>
      </section>
    </>
  );
}
