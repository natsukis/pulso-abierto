// B. Consulta de datos y C. Error y recuperación, desde la página de consulta.
// Se simula el servicio: la página no sabe (ni necesita saber) la dirección de la API.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, fetchPrices } from '../services/coingecko';
import { deferred, samplePrices } from '../test/fixtures';
import type { CoinPrice } from '../types/crypto';
import { SearchPage } from './SearchPage';

vi.mock('../services/coingecko', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/coingecko')>();
  return { ...actual, fetchPrices: vi.fn() };
});

function renderSearchPage(route = '/?moneda=usd') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SearchPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(fetchPrices).mockReset();
});

describe('consulta de datos', () => {
  it('muestra la carga y luego el resultado', async () => {
    const pending = deferred<CoinPrice[]>();
    vi.mocked(fetchPrices).mockReturnValue(pending.promise);
    renderSearchPage();

    expect(screen.getByRole('status')).toHaveTextContent('Cargando:');
    expect(screen.getByRole('button', { name: 'Consultando…' })).toBeInTheDocument();

    pending.resolve(samplePrices);

    expect(await screen.findByRole('list', { name: /precios de criptomonedas en usd/i })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Consulta completada: se muestran 3 de 3 criptomonedas',
    );
  });

  it('informa la ausencia de datos cuando el servicio no devuelve precios', async () => {
    vi.mocked(fetchPrices).mockResolvedValue([]);
    renderSearchPage();

    expect(await screen.findByText(/no devolvió precios para mostrar/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Sin resultados:');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('consulta desde el formulario y filtra sin repetir la solicitud', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPrices).mockResolvedValue(samplePrices);
    renderSearchPage('/');

    expect(screen.getByRole('status')).toHaveTextContent('Sin consultar:');
    await user.type(screen.getByLabelText('Buscar por nombre o símbolo'), 'eth');
    await user.click(screen.getByRole('button', { name: 'Consultar precios' }));

    expect(await screen.findAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 3, name: /ethereum/i })).toBeInTheDocument();
    expect(fetchPrices).toHaveBeenCalledOnce();
  });

  it('no consulta mientras el formulario tenga errores', async () => {
    const user = userEvent.setup();
    renderSearchPage('/');

    const search = screen.getByLabelText('Buscar por nombre o símbolo');
    await user.type(search, ' b ');
    await user.click(screen.getByRole('button', { name: 'Consultar precios' }));

    expect(screen.getByText(/Ingresá al menos 2 caracteres/)).toBeInTheDocument();
    expect(search).toHaveAttribute('aria-invalid', 'true');
    expect(search).toHaveFocus();
    expect(fetchPrices).not.toHaveBeenCalled();
  });
});

describe('error y recuperación', () => {
  it('muestra un mensaje comprensible y permite reintentar la consulta', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetchPrices)
      .mockRejectedValueOnce(
        new ApiError(
          'El servicio de precios no está disponible en este momento. Intentá nuevamente en unos instantes.',
          503,
        ),
      )
      .mockResolvedValueOnce(samplePrices);
    renderSearchPage();

    expect(await screen.findByText(/no está disponible en este momento/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Error:');

    await user.click(screen.getByRole('button', { name: 'Reintentar la consulta' }));

    expect(await screen.findAllByRole('article')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Reintentar la consulta' })).not.toBeInTheDocument();
    expect(fetchPrices).toHaveBeenCalledTimes(2);
  });
});
