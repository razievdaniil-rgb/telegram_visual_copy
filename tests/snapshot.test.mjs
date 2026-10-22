import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotStorage } from '../src/snapshot.ts';
function fixture() {
  const map = new Map();
  const adapter = {
    getItem: async (k) => map.get(k) ?? null,
    setItem: async (k, v) => {
      map.set(k, v);
    },
    multiGet: async (keys) => keys.map((k) => [k, map.get(k) ?? null]),
    multiSet: async (entries) => {
      entries.forEach(([k, v]) => map.set(k, v));
    },
    multiRemove: async (keys) => {
      keys.forEach((k) => map.delete(k));
    },
  };
  return { map, adapter, storage: snapshotStorage(adapter, 'test') };
}
test('пустое хранилище и обратная совместимость с обычным JSON', async () => {
  const { storage, map } = fixture();
  assert.equal(await storage.read(), null);
  map.set('test', '{"version":1}');
  assert.equal(await storage.read(), '{"version":1}');
});
test('большой документ и emoji восстанавливаются без потерь', async () => {
  const { storage, map } = fixture();
  const raw = 'a'.repeat(249999) + '🙂' + 'b'.repeat(2_100_000);
  await storage.write(raw);
  assert.equal(await storage.read(), raw);
  assert.ok([...map.values()].every((v) => v.length <= 250001));
});
test('сбой записи сохраняет предыдущий документ, следующий save восстанавливается', async () => {
  const { storage, adapter } = fixture();
  await storage.write('first');
  const set = adapter.setItem;
  adapter.setItem = async () => {
    throw new Error('disk full');
  };
  await assert.rejects(storage.write('second'));
  assert.equal(await storage.read(), 'first');
  adapter.setItem = set;
  await storage.write('third');
  assert.equal(await storage.read(), 'third');
});
test('быстрые сохранения выполняются по очереди, старые части очищаются', async () => {
  const { storage, map } = fixture();
  await Promise.all([storage.write('first'), storage.write('second'), storage.write('third')]);
  assert.equal(await storage.read(), 'third');
  assert.equal(map.size, 2);
});
test('отсутствующая часть документа вызывает ошибку загрузки', async () => {
  const { storage, map } = fixture();
  await storage.write('test');
  const manifest = JSON.parse(map.get('test'));
  map.delete(manifest.keys[0]);
  await assert.rejects(storage.read());
});
