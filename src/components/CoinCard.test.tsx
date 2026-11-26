// A. Favoritos: la persona marca y desmarca desde la tarjeta y la interfaz lo representa.
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { samplePrices } from '../test/fixtures';
import { CoinCard } from './CoinCard';

describe('favoritos en la tarjeta', () => {
  it('permite marcar y desmarcar una criptomoneda', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CoinCard coin={samplePrices[0]} currency="usd" listSearch="" />
      </MemoryRouter>,
    );
    const card = screen.getByRole('article', { name: /bitcoin/i });
    const button = within(card).getByRole('button', { name: /favorita: bitcoin/i });

    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(within(card).queryByText('★ Favorita')).not.toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(within(card).getByText('★ Favorita')).toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(within(card).queryByText('★ Favorita')).not.toBeInTheDocument();
  });

  it('se puede marcar con el teclado', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CoinCard coin={samplePrices[1]} currency="usd" listSearch="" />
      </MemoryRouter>,
    );

    await user.tab(); // «Ver detalle»
    await user.tab(); // «Favorita»
    expect(screen.getByRole('button', { name: /favorita: ethereum/i })).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: /favorita: ethereum/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
