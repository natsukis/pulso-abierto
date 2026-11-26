# Pulso Abierto

Aplicación web que consulta el precio actual de **Bitcoin, Ethereum y Solana** en la API pública de CoinGecko. Permite buscar por nombre o símbolo, elegir la moneda de cotización (USD, EUR o ARS), ver el detalle de cada criptomoneda y marcar favoritas, que se conservan al recargar.

**Aplicación publicada:** https://pulso-abierto-lac.vercel.app
**Repositorio:** https://github.com/natsukis/pulso-abierto

**Autor:** Benjamin Natsuki Hokama — Programación Web, Actividad 4 (versión final).

## Tecnologías principales

- **React 19** y **TypeScript**, con **Vite 8** como entorno de desarrollo y build.
- **React Router**: rutas `/`, `/criptomonedas/:id` y página 404.
- **Zod**: validación del formulario y de la respuesta de la API.
- **Zustand** con `persist`: favoritos globales guardados en `localStorage`.
- **Vitest**, **Testing Library** y **user-event**: pruebas automatizadas en jsdom.
- **oxlint**: análisis estático.
- **Vercel**: publicación.

## Requisitos

- Node.js 22.12 o superior (declarado en `engines` de `package.json`) y npm.

> En Windows conviene clonar el proyecto en una ruta corta (por ejemplo `C:\proyectos\`): TypeScript 7 falla si la ruta de `node_modules` supera los 260 caracteres.

## Instalación y uso

```bash
npm install         # instala las dependencias
npm run dev         # servidor de desarrollo en http://localhost:5173/
npm run test        # ejecuta las pruebas una vez (Vitest)
npm run lint        # análisis estático (oxlint)
npm run build       # comprobación de tipos (tsc -b) + build de producción en dist/
npm run preview     # sirve el build de dist/ en http://localhost:4173/
```

Otros scripts: `npm run typecheck` (solo tipos) y `npm run test:watch` (pruebas en modo observación).

## Variables de entorno

El proyecto **no usa variables de entorno**: la API de CoinGecko es pública y no requiere clave. La dirección de la API está definida en `src/services/coingecko.ts`. El `.gitignore` excluye igualmente los archivos `.env*` por si en el futuro se agregan.

## Despliegue en Vercel

El repositorio está vinculado con Vercel y cada push a `main` genera un despliegue de producción. Configuración (también declarada en `vercel.json`):

| Parámetro | Valor |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` (predeterminado) |
| Variables de entorno | Ninguna |

`vercel.json` también define una **rewrite** de todas las rutas a `/index.html`. Las rutas las resuelve React Router en el navegador; sin esa regla, abrir o recargar una dirección como `/criptomonedas/bitcoin` devolvería un 404 del servidor. Los archivos que existen en `dist` (JS, CSS, favicon) se siguen sirviendo directamente.

## Estructura

```
src/
├── main.tsx · App.tsx         punto de entrada y estructura general (rutas, encabezado, pie)
├── components/                QueryForm, StatusMessage, CoinList, CoinCard, FavoriteButton
├── pages/                     SearchPage, CoinDetailPage, NotFoundPage
├── hooks/                     useRemoteData (solicitud, cancelación, reintentos), usePrices, useCoinDetail
├── store/favoritesStore.ts    favoritos con Zustand + persistencia
├── services/coingecko.ts      acceso a la API (fetch, response.ok, JSON validado, adaptación al modelo)
├── schemas/ · types/ · data/ · utils/
└── test/                      configuración y datos de prueba
```

Las pruebas están junto al código que prueban (`*.test.ts(x)`). Ninguna consulta la API real: se simulan `fetch` o el servicio.

## Mejora de mantenibilidad (Actividad 4)

- **Problema identificado:** `src/styles.css` conservaba 64 líneas de estilos de la Actividad 1 que ya no usaba ningún componente: `.field-group`, `.checkbox-list`, `.checkbox` (con `:hover`, `input` y `:has(...)`), `.hint--warning` y sus variantes en las media queries. Correspondían a las casillas de selección de monedas, que se reemplazaron por el formulario controlado en la Actividad 2. Se detectaron comparando las clases del CSS con las usadas en los `.tsx` y en `index.html`. Las clases que se arman dinámicamente, como `price-card--${id}`, se revisaron aparte y sí se usan.
- **Cambio realizado:** se eliminaron esas reglas, y el selector compartido `.field-group legend, .field label` quedó como `.field label`. No se modificó ningún componente.
- **Comprobación de regresiones:** `npm run test` (19/19), `npm run lint` y `npm run build` sin errores. La prueba de recorridos en el navegador (47 comprobaciones) se ejecutó antes y después del cambio, y se compararon píxel por píxel las 15 capturas: 10 son idénticas y las otras 5 difieren solo en la hora «Actualizado a las…» y en el ícono animado de carga, que cambian en cada ejecución.

## Verificación final

**Fecha de verificación:** 25 de noviembre de 2026.

- **Pruebas ejecutadas:** `npm run test` con 6 archivos y 19 pruebas correctas (favoritos, consulta, error y reintento, servicio, store y cancelación de consultas). También `npm run lint` sin advertencias.
- **Build generado correctamente:** `npm run build` (comprobación de tipos con `tsc -b` y `vite build`) generó `dist/` sin errores.
- **Preview comprobado:** con `npm run preview` la aplicación cargó, consultó la API real (una solicitud por vista), navegó del listado al detalle y abrió un detalle por acceso directo, sin errores en la consola. Los recorridos de la consigna 1 se comprobaron sobre el build con una prueba automatizada en el navegador (47/47): consulta, detalle y regreso, favoritos al cambiar de vista y al recargar, formulario con validación, vista móvil (390 px) y de escritorio (1280 px).
- **Despliegue realizado:** el repositorio `natsukis/pulso-abierto` está vinculado con Vercel (preset Vite, `npm run build`, salida `dist`, sin variables de entorno). En https://pulso-abierto-lac.vercel.app se comprobó con la API real (18/18):
  - la aplicación carga y la consulta devuelve las tres criptomonedas;
  - el formulario valida y filtra;
  - los favoritos se marcan, se reflejan en el detalle y se conservan al recargar;
  - se navega del listado al detalle y se vuelve con los criterios conservados;
  - `/criptomonedas/ethereum` se puede recargar y `/criptomonedas/solana` abre por acceso directo;
  - un id inexistente y una ruta desconocida muestran sus mensajes;
  - la vista móvil no tiene desplazamiento horizontal;
  - la consola no muestra errores.
