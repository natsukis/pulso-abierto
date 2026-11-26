// A. Favoritos entre vistas: lo que se marca en el listado aparece en el detalle y viceversa.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { fetchCoinDetail, fetchPrices } from './services/coingecko';
import { sampleDetail, samplePrices } from './test/fixtures';

vi.mock('./services/coingecko', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./services/coingecko')>();
  return { ...actual, fetchPrices: vi.fn(), fetchCoinDetail: vi.fn() };
});

describe('favoritos compartidos entre vistas', () => {
  it('la selección del listado se refleja en el detalle y en el encabezado', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPrices).mockResolvedValue(samplePrices);
    vi.mocked(fetchCoinDetail).mockResolvedValue(sampleDetail('ethereum'));
    render(
      <MemoryRouter initialEntries={['/?moneda=usd']}>
        <App />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: /favorita: ethereum/i }));
    expect(screen.getByText(/Favoritas guardadas: 1/)).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /ver detalle de ethereum/i }));
    const detailButton = await screen.findByRole('button', { name: /favorita: ethereum/i });
    expect(screen.getByRole('heading', { level: 2, name: /ethereum/i })).toBeInTheDocument();
    expect(detailButton).toHaveAttribute('aria-pressed', 'true');

    // Se desmarca desde el detalle y se vuelve al listado.
    await user.click(detailButton);
    expect(screen.getByText(/Favoritas guardadas: 0/)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /volver a los resultados/i }));

    expect(await screen.findByRole('button', { name: /favorita: ethereum/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
