import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import TabletopCombatDialog from './TabletopCombatDialog';

afterEach(() => { cleanup(); document.body.style.overflow = ''; });
function Harness() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Abrir janela</button>
    <button>Comando fora da janela</button>
    <TabletopCombatDialog open={open} onClose={() => setOpen(false)}>
      <input aria-label="Ação em preparação" defaultValue="" />
      <details><summary>Opções recolhidas</summary><button>Comando recolhido</button></details>
      <button>Última ação</button>
      <div hidden><button>Comando oculto</button></div>
      <button disabled>Comando indisponível</button>
    </TabletopCombatDialog>
  </>;
}
it('closes with Escape or its button, restores focus and preserves drafts and scroll when reopened', () => {
  document.body.style.overflow = 'auto';
  render(<Harness />);
  const opener = screen.getByRole('button', { name: 'Abrir janela' });
  opener.focus(); fireEvent.click(opener);
  const dialog = screen.getByRole('dialog', { name: 'Combate' });
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fechar combate' }));
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.change(screen.getByLabelText('Ação em preparação'), { target: { value: 'Atacar com a pistola' } });
  const body = dialog.querySelector('.vt-combat-window-body'); body.scrollTop = 145;
  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(opener);
  expect(document.body.style.overflow).toBe('auto');
  // Reopening restores the saved position even if a hidden element lost layout.
  body.scrollTop = 0;
  fireEvent.click(opener);
  expect(screen.getByLabelText('Ação em preparação').value).toBe('Atacar com a pistola');
  expect(body.scrollTop).toBe(145);
  fireEvent.click(screen.getByRole('button', { name: 'Fechar combate' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});
it('keeps keyboard navigation inside the window and excludes hidden, collapsed and disabled commands', () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole('button', { name: 'Abrir janela' }));
  const close = screen.getByRole('button', { name: 'Fechar combate' });
  const last = screen.getByRole('button', { name: 'Última ação' });
  fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(last, { key: 'Tab' });
  expect(document.activeElement).toBe(close);
});
