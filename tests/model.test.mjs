import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decodeDocument,
  emptyDocument,
  localParts,
  messagesFor,
  parseLocal,
  reducer,
  sortedChats,
} from '../src/model.ts';

const profile = {
  id: 'p1',
  firstName: 'Анна',
  lastName: '',
  username: 'anna',
  phone: '+7 000',
  bio: '',
  avatar: null,
  color: '#123456',
};
const chat = {
  id: 'c1',
  profileId: 'p1',
  presence: 'online',
  unread: 3,
  createdAt: '2026-10-20T12:00:00.000Z',
};
const message = {
  id: 'm1',
  chatId: 'c1',
  text: 'Привет',
  direction: 'incoming',
  sentAt: '2026-10-22T12:00:00.000Z',
  receipt: 'sent',
  edited: false,
};
function fixture() {
  return reducer(reducer(emptyDocument(), { type: 'profile/save', profile }), {
    type: 'chat/save',
    chat,
  });
}
test('создание профиля и чата, сохранение обеих сторон сообщения', () => {
  let state = reducer(fixture(), { type: 'message/save', message });
  state = reducer(state, {
    type: 'message/save',
    message: { ...message, id: 'm2', direction: 'outgoing', receipt: 'read' },
  });
  assert.equal(state.messages.length, 2);
  assert.equal(state.messages[1].direction, 'outgoing');
  assert.equal(state.messages[1].receipt, 'read');
});
test('редактирование сохраняет идентификатор, меняет сторону, время и галочки', () => {
  const original = reducer(fixture(), { type: 'message/save', message });
  const changed = reducer(original, {
    type: 'message/save',
    message: {
      ...message,
      text: '  Новый текст  ',
      direction: 'outgoing',
      receipt: 'read',
      sentAt: '2026-10-21T08:30:00.000Z',
      edited: true,
    },
  });
  assert.equal(changed.messages.length, 1);
  assert.equal(changed.messages[0].text, 'Новый текст');
  assert.equal(changed.messages[0].edited, true);
  assert.equal(changed.messages[0].receipt, 'read');
  assert.equal(original.messages[0].text, 'Привет');
});
test('ручное изменение даты пересортировывает сообщения и список чатов', () => {
  let state = fixture();
  state = reducer(state, { type: 'chat/save', chat: { ...chat, id: 'c2' } });
  state = reducer(state, { type: 'message/save', message });
  state = reducer(state, {
    type: 'message/save',
    message: { ...message, id: 'm2', chatId: 'c2', sentAt: '2026-10-23T12:00:00Z' },
  });
  state = reducer(state, {
    type: 'message/save',
    message: { ...message, id: 'm3', sentAt: '2026-10-21T12:00:00Z' },
  });
  assert.deepEqual(
    messagesFor(state, 'c1').map((m) => m.id),
    ['m3', 'm1'],
  );
  assert.deepEqual(
    sortedChats(state).map((c) => c.id),
    ['c2', 'c1'],
  );
  state = reducer(state, {
    type: 'message/save',
    message: { ...message, sentAt: '2026-10-24T12:00:00Z' },
  });
  assert.deepEqual(
    sortedChats(state).map((c) => c.id),
    ['c1', 'c2'],
  );
});
test('прочтение сбрасывает только нужный счётчик', () => {
  const state = reducer(fixture(), { type: 'chat/save', chat: { ...chat, id: 'c2' } });
  const read = reducer(state, { type: 'chat/read', id: 'c1' });
  assert.equal(read.chats[0].unread, 0);
  assert.equal(read.chats[1].unread, 3);
});
test('редактирование профиля не создаёт дубликат и не теряет переписку', () => {
  const state = reducer(reducer(fixture(), { type: 'message/save', message }), {
    type: 'profile/save',
    profile: { ...profile, firstName: 'Мария', phone: 'любой номер' },
  });
  assert.equal(state.profiles.length, 1);
  assert.equal(state.profiles[0].phone, 'любой номер');
  assert.equal(state.chats[0].profileId, state.profiles[0].id);
  assert.equal(state.messages.length, 1);
});
test('удаление чата удаляет его сообщения и сохраняет остальные', () => {
  let state = reducer(fixture(), { type: 'chat/save', chat: { ...chat, id: 'c2' } });
  state = reducer(state, { type: 'message/save', message });
  state = reducer(state, { type: 'message/save', message: { ...message, id: 'm2', chatId: 'c2' } });
  state = reducer(state, { type: 'chat/delete', id: 'c1' });
  assert.deepEqual(
    state.chats.map((c) => c.id),
    ['c2'],
  );
  assert.deepEqual(
    state.messages.map((m) => m.id),
    ['m2'],
  );
});
test('пустой текст, неверная дата и несуществующий чат не сохраняются', () => {
  const state = fixture();
  for (const patch of [{ text: '  ' }, { sentAt: 'oops' }, { chatId: 'missing' }])
    assert.equal(
      reducer(state, { type: 'message/save', message: { ...message, ...patch } }),
      state,
    );
  assert.equal(reducer(emptyDocument(), { type: 'chat/save', chat }).chats.length, 0);
});
test('документ переживает сериализацию с аватаром, статусами и сообщениями', () => {
  let state = reducer(fixture(), {
    type: 'profile/save',
    profile: { ...profile, avatar: 'data:image/png;base64,example' },
  });
  state = reducer(state, { type: 'message/save', message });
  state = reducer(state, { type: 'chat/save', chat: { ...chat, presence: 'typing' } });
  assert.deepEqual(decodeDocument(JSON.stringify(state)), state);
});
test('повреждённые данные, неизвестная схема и висячие ссылки отклоняются', () => {
  assert.throws(() => decodeDocument('{broken'));
  const state = fixture();
  for (const patch of [
    { version: 2 },
    { profiles: [] },
    { chats: [{ ...chat, unread: -1 }] },
    { messages: [{ ...message, direction: 'bad' }] },
    { profiles: [profile, profile] },
  ])
    assert.throws(() => decodeDocument(JSON.stringify({ ...state, ...patch })));
});
test('локальные даты проверяются строго: високосный год, часы, минуты', () => {
  assert.ok(parseLocal('2028-02-29', '23:59'));
  for (const [date, time] of [
    ['2026-02-29', '12:00'],
    ['2026-04-31', '12:00'],
    ['2026-10-22', '24:00'],
    ['2026-10-22', '12:60'],
    ['22.10.2026', '12:00'],
  ])
    assert.equal(parseLocal(date, time), null);
  const iso = parseLocal('2026-10-22', '17:25');
  assert.deepEqual(localParts(iso), { date: '2026-10-22', time: '17:25' });
});
