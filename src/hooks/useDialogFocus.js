import { useEffect } from 'react';

export function useDialogFocus(name, close) {
  useEffect(() => {
    if (!name) return;
    const dialog = document.querySelector(`[data-asa-dialog="${name}"]`);
    if (!dialog) return;
    const previous = document.activeElement;
    const focusable = () => [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]')];
    (focusable()[0] || dialog).focus();
    const handle = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        const nodes=focusable(), first=nodes[0], last=nodes.at(-1);
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    dialog.addEventListener('keydown', handle);
    return () => { dialog.removeEventListener('keydown', handle); previous?.focus(); };
  }, [name, close]);
}
