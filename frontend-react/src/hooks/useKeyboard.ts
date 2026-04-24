import { useEffect } from 'react';

interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
}

/**
 * Register keyboard shortcuts.
 * Pass a stable array of bindings (memoize with useMemo if needed).
 *
 * Example:
 *   useKeyboard([
 *     { key: 'Enter', handler: () => handleConfirm() },
 *     { key: 'Escape', handler: () => closeModal() },
 *   ]);
 */
export function useKeyboard(bindings: KeyBinding[]): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses inside input / textarea elements
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      for (const binding of bindings) {
        const ctrlMatch  = binding.ctrl  ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = binding.shift ? e.shiftKey               : true;
        if (
          e.key === binding.key &&
          ctrlMatch &&
          shiftMatch
        ) {
          e.preventDefault();
          binding.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bindings]);
}
