// Keep each AsyncStorage value below Android's per-entry SQLite window limit.
// Write new chunks before swapping the manifest, so a failed save preserves the previous snapshot.
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  multiGet(keys: readonly string[]): Promise<readonly (readonly [string, string | null])[]>;
  multiSet(entries: [string, string][]): Promise<void>;
  multiRemove(keys: readonly string[]): Promise<void>;
}
export function snapshotStorage(adapter: StorageAdapter, key: string) {
  let queue: Promise<unknown> = Promise.resolve();
  const prefix = `${key}:chunk:`;
  function manifest(raw: string | null): string[] | null {
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.storage !== 'chunks-v1') return null;
    if (
      !Array.isArray(parsed.keys) ||
      !parsed.keys.length ||
      !parsed.keys.every((k: unknown) => typeof k === 'string' && k.startsWith(prefix)) ||
      new Set(parsed.keys).size !== parsed.keys.length
    )
      throw new Error('Повреждено локальное хранилище');
    return parsed.keys;
  }
  return {
    async read(): Promise<string | null> {
      const raw = await adapter.getItem(key);
      const keys = manifest(raw);
      if (!keys) return raw;
      const entries = new Map(await adapter.multiGet(keys));
      return keys
        .map((k) => {
          const value = entries.get(k);
          if (value == null) throw new Error('Не найдена часть сохранённой переписки');
          return value;
        })
        .join('');
    },
    write(raw: string): Promise<void> {
      const job = queue
        .catch(() => undefined)
        .then(async () => {
          const oldKeys = manifest(await adapter.getItem(key));
          const revision = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
          const entries: [string, string][] = [];
          for (let start = 0; start < raw.length;) {
            let end = Math.min(start + 250_000, raw.length);
            const lastCode = raw.charCodeAt(end - 1);
            if (end < raw.length && lastCode >= 0xd800 && lastCode <= 0xdbff) end++;
            entries.push([`${prefix}${revision}:${entries.length}`, raw.slice(start, end)]);
            start = end;
          }
          if (!entries.length) entries.push([`${prefix}${revision}:0`, '']);
          try {
            await adapter.multiSet(entries);
            await adapter.setItem(
              key,
              JSON.stringify({ storage: 'chunks-v1', keys: entries.map(([k]) => k) }),
            );
          } catch (error) {
            await adapter.multiRemove(entries.map(([k]) => k)).catch(() => undefined);
            throw error;
          }
          if (oldKeys) await adapter.multiRemove(oldKeys).catch(() => undefined);
        });
      queue = job;
      return job;
    },
  };
}
