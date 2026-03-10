import '@testing-library/jest-dom';

// Vitest/jsdom in some environments does not provide a full Storage impl.
// Ensure localStorage exists and supports clear/getItem/setItem for hooks/tests.
(() => {
  const existing = (globalThis as any).localStorage;
  if (existing && typeof existing.clear === 'function') return;

  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };

  try {
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  } catch {
    (globalThis as any).localStorage = storage;
  }
  try {
    Object.defineProperty((globalThis as any).window ?? globalThis, 'localStorage', { value: storage, configurable: true });
  } catch {
    /* ignore */
  }
})();

