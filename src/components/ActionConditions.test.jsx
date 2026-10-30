import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import ActionConditions from './ActionConditions';

afterEach(cleanup);

it('explains darkness and the derived conditions without duplicating their penalties', () => {
  render(<ActionConditions ids={['cego', 'desprevenido']} />);
  const details = screen.getByText('Ver condições: Cego, Desprevenido').closest('details');
  expect(details.open).toBe(false);
  expect(details.textContent).toContain('50% de chance de erro');
  expect(screen.getAllByText('Desprevenido', { selector: 'dt' })).toHaveLength(1);
  expect(details.textContent).toContain('Defesa -5 e -1d20 em Reflexos');
  expect(details.textContent).toContain('Não pode correr nem fazer investida');
  expect(details.textContent).toContain('Ordem 1.3, p. 310');
});

it('leaves custom actions without condition metadata usable', () => {
  const { container, rerender } = render(<ActionConditions />);
  expect(container.textContent).toBe('');
  rerender(<ActionConditions ids={['condicao-desconhecida']} />);
  expect(container.textContent).toBe('');
  rerender(<ActionConditions ids={null} />);
  expect(container.textContent).toBe('');
});
