import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import SyncStatus from './SyncStatus';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('keeps recovery actions available for an error even after the sheet reports a successful save', () => {
  const props = { status: { state: 'saved', message: 'Ficha salva.' }, onRetry: vi.fn(), onExport: vi.fn() };
  const { rerender } = render(<SyncStatus {...props} />);
  expect(screen.queryByRole('complementary', { name: 'Sincronização da ficha' })).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('Ficha salva.');
  rerender(<SyncStatus {...props} error="A conexão com a campanha falhou." />);
  expect(screen.getByRole('complementary', { name: 'Sincronização da ficha' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  fireEvent.click(screen.getByRole('button', { name: 'Exportar cópia' }));
  expect(props.onRetry).toHaveBeenCalledOnce();
  expect(props.onExport).toHaveBeenCalledOnce();
  rerender(<SyncStatus {...props} />);
  expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
});

it('keeps a conflicting draft recoverable and requires confirmation before using the server version', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  const onReload = vi.fn(), onExport = vi.fn();
  render(<SyncStatus status={{ state: 'conflict', message: 'Sua cópia local foi preservada.' }} onReload={onReload} onExport={onExport} />);
  fireEvent.click(screen.getByRole('button', { name: 'Exportar cópia' }));
  expect(onExport).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Usar versão do servidor' }));
  expect(onReload).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Usar versão do servidor' }));
  expect(onReload).toHaveBeenCalledOnce();
});
