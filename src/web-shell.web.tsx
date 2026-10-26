import { useEffect, useSyncExternalStore } from 'react';
let keyboard = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export function useWebKeyboard() {
  return useSyncExternalStore(
    subscribe,
    () => keyboard,
    () => false,
  );
}
export function WebShell() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let fullHeight = window.innerHeight;
    const update = () => {
      const height = viewport?.height ?? window.innerHeight;
      const active = document.activeElement;
      const editing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if (!editing) fullHeight = Math.max(fullHeight, window.innerHeight);
      keyboard = editing && fullHeight - height > 120;
      root.style.setProperty('--viewport-height', `${height}px`);
      root.style.setProperty('--viewport-top', `${viewport?.offsetTop ?? 0}px`);
      root.style.setProperty('--screen-height', `${fullHeight}px`);
      listeners.forEach((notify) => notify());
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    if (!__DEV__ && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        window.dispatchEvent(new Event('pwa-offline-error'));
      });
    }
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);
  return null;
}
