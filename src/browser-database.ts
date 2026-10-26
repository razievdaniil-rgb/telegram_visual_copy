// Transactions resolve on commit, never merely on an individual request's success.
export class BrowserDatabase {
  private connection?: Promise<IDBDatabase>;
  private factory: IDBFactory;
  private name: string;
  constructor(factory: IDBFactory, name = 'telegram-visual-copy') {
    this.factory = factory;
    this.name = name;
  }
  private open() {
    return (this.connection ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = this.factory.open(this.name, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('workspace');
      };
      request.onerror = () => {
        this.connection = undefined;
        reject(request.error);
      };
      request.onblocked = () => {
        this.connection = undefined;
        reject(new Error('Закройте старую вкладку приложения'));
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          this.connection = undefined;
        };
        resolve(db);
      };
    }));
  }
  async read(key: string): Promise<string | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workspace', 'readonly');
      const request = tx.objectStore('workspace').get(key);
      tx.oncomplete = () => resolve(request.result ?? null);
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Не удалось открыть данные'));
    });
  }
  async write(entries: [string, string][]): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('workspace', 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Не удалось сохранить данные'));
      try {
        for (const [key, value] of entries) tx.objectStore('workspace').put(value, key);
      } catch (error) {
        tx.abort();
        reject(error);
      }
    });
  }
  async migrateDocument(
    readLegacy: () => Promise<string | null>,
    validate: (raw: string) => unknown,
  ) {
    const existing = await this.read('document');
    if (existing !== null) {
      validate(existing);
      return existing;
    }
    const legacy = await readLegacy();
    if (legacy === null) return null;
    validate(legacy);
    const db = await this.open();
    return new Promise<string>((resolve, reject) => {
      const tx = db.transaction('workspace', 'readwrite');
      const store = tx.objectStore('workspace');
      const request = store.get('document');
      let chosen = legacy;
      request.onsuccess = () => {
        chosen = request.result ?? legacy;
        if (request.result == null) store.put(legacy, 'document');
      };
      tx.oncomplete = () => resolve(chosen);
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Не удалось перенести данные'));
    });
  }
}
