import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import { BrowserDatabase } from '../src/browser-database.ts';
import { emptyDocument, decodeDocument } from '../src/model.ts';
import {
  emptyPreferences,
  decodePreferences,
  toggleId,
  visibleChats,
  searchMessages,
  searchChats,
} from '../src/preferences-model.ts';
import { encodeBackup, decodeBackup } from '../src/backup-model.ts';

const fixture = () => {
  const data = emptyDocument();
  data.profiles = [{ ...data.self, id: 'anna', firstName: 'Анна', lastName: 'Миронова' }];
  data.chats = ['a', 'b', 'c'].map((id, index) => ({
    id,
    profileId: 'anna',
    presence: 'online',
    unread: 0,
    createdAt: new Date(index * 60000).toISOString(),
  }));
  data.messages = [
    {
      id: 'm',
      chatId: 'b',
      text: 'Привет! Строка\n🙂',
      direction: 'incoming',
      receipt: 'read',
      edited: false,
      sentAt: new Date(0).toISOString(),
    },
  ];
  return data;
};
test('archive, pinning and folder membership preserve message data and ordering', () => {
  const data = fixture();
  const before = JSON.stringify(data);
  const prefs = emptyPreferences();
  prefs.archived = toggleId(prefs.archived, 'c');
  prefs.pinned = toggleId(prefs.pinned, 'a');
  prefs.folders = [{ id: 'work', title: 'Работа', chatIds: ['b', 'c'] }];
  assert.deepEqual(
    visibleChats(data, prefs).map((c) => c.id),
    ['a', 'b'],
  );
  assert.deepEqual(
    visibleChats(data, prefs, 'archive').map((c) => c.id),
    ['c'],
  );
  assert.deepEqual(
    visibleChats(data, prefs, 'work').map((c) => c.id),
    ['b'],
  );
  prefs.archived = toggleId(prefs.archived, 'c');
  assert.deepEqual(
    visibleChats(data, prefs, 'work').map((c) => c.id),
    ['c', 'b'],
  );
  assert.equal(JSON.stringify(data), before);
});
test('search matches Cyrillic names and actual message text across folders', () => {
  const data = fixture();
  assert.equal(searchChats(data, '  МИРОНОВА ').length, 3);
  assert.deepEqual(
    searchMessages(data, 'строка\n🙂').map((m) => m.id),
    ['m'],
  );
  assert.equal(searchMessages(data, ' ').length, 0);
  assert.equal(searchMessages(data, 'not found').length, 0);
});
test('backup round-trip retains avatar, exact timestamps and separate UI preferences', () => {
  const data = fixture();
  data.profiles[0].avatar = 'data:image/jpeg;base64,QQ==';
  const prefs = {
    ...emptyPreferences(),
    fontSize: 22,
    wallpaper: 'blue',
    folders: [{ id: 'x', title: 'Тест', chatIds: ['b'] }],
  };
  assert.deepEqual(decodeBackup(encodeBackup(data, prefs)), { document: data, preferences: prefs });
  assert.throws(() => decodeBackup('{"kind":"different","version":1}'));
  assert.throws(() => decodePreferences(JSON.stringify({ ...prefs, fontSize: 99 })));
  assert.throws(() =>
    decodePreferences(JSON.stringify({ ...prefs, folders: [{ id: 'x', title: '', chatIds: [] }] })),
  );
});
test('legacy migration validates first, commits to IndexedDB, and keeps the source intact', async () => {
  const db = new BrowserDatabase(new IDBFactory());
  const legacy = JSON.stringify(fixture());
  let reads = 0;
  assert.equal(
    await db.migrateDocument(async () => {
      reads++;
      return legacy;
    }, decodeDocument),
    legacy,
  );
  assert.equal(await db.read('document'), legacy);
  assert.equal(
    await db.migrateDocument(async () => {
      throw new Error('must not read legacy twice');
    }, decodeDocument),
    legacy,
  );
  assert.equal(reads, 1);
  assert.equal(JSON.parse(legacy).version, 1);
});
test('corrupt legacy and missing chunks do not create a replacement empty document', async () => {
  const db = new BrowserDatabase(new IDBFactory());
  await assert.rejects(db.migrateDocument(async () => '{bad', decodeDocument));
  assert.equal(await db.read('document'), null);
  await assert.rejects(
    db.migrateDocument(async () => {
      throw new Error('missing chunk');
    }, decodeDocument),
  );
  assert.equal(await db.read('document'), null);
});
test('failed multi-record restore rolls back the entire transaction', async () => {
  const db = new BrowserDatabase(new IDBFactory());
  await db.write([
    ['document', 'old'],
    ['preferences', 'old preferences'],
  ]);
  await assert.rejects(
    db.write([
      ['document', 'new'],
      ['preferences', () => {}],
    ]),
  );
  assert.equal(await db.read('document'), 'old');
  assert.equal(await db.read('preferences'), 'old preferences');
});
test('a concurrent migration cannot overwrite a newer committed document', async () => {
  const db = new BrowserDatabase(new IDBFactory());
  const old = JSON.stringify(fixture());
  const newer = JSON.stringify({ ...fixture(), self: { ...fixture().self, firstName: 'Новый' } });
  await db.migrateDocument(async () => {
    await db.write([['document', newer]]);
    return old;
  }, decodeDocument);
  assert.equal(await db.read('document'), newer);
});
