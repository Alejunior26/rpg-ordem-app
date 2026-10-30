import React, { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function focusableElements(dialog) {
  return [...dialog.querySelectorAll('button, input, select, textarea, a[href], summary, [tabindex]')].filter((element) => {
    if (element.tabIndex < 0 || element.matches(':disabled')) return false;
    for (let parent = element; parent && parent !== dialog; parent = parent.parentElement) {
      const style = window.getComputedStyle(parent);
      if (parent.hidden || style.display === 'none' || style.visibility === 'hidden') return false;
      if (parent.tagName === 'DETAILS' && !parent.open && !parent.querySelector(':scope > summary')?.contains(element)) return false;
    }
    return true;
  });
}

export default function TabletopCombatDialog({ open, onClose, children }) {
  const dialog = useRef(null), closeButton = useRef(null);
  const content = useRef(null), savedScroll = useRef(0);
  const titleId = useId();
  const close = () => {
    if (content.current) savedScroll.current = content.current.scrollTop;
    onClose();
  };
  useLayoutEffect(() => {
    if (open && content.current) content.current.scrollTop = savedScroll.current;
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);

  return createPortal(
    <div className="vt-shell vt-combat-overlay" hidden={!open}>
      <section
        ref={dialog}
        className="vt-combat-window"
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.defaultPrevented) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close();
          } else if (event.key === 'Tab') {
            const elements = focusableElements(dialog.current);
            const first = elements[0], last = elements.at(-1);
            if (!first) { event.preventDefault(); dialog.current.focus(); }
            else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
          }
        }}
      >
        <header className="vt-combat-window-header">
          <div><h2 id={titleId}>Combate</h2><p>Rodadas, iniciativa e ações da missão.</p></div>
          <button ref={closeButton} type="button" onClick={close} aria-label="Fechar combate">Voltar ao mapa <kbd>Esc</kbd></button>
        </header>
        <div ref={content} className="vt-combat-window-body" onScroll={(event) => { if (open) savedScroll.current = event.currentTarget.scrollTop; }}>{children}</div>
      </section>
    </div>, document.body,
  );
}
