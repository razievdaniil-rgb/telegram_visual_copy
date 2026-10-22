export type Presence = 'online' | 'recently' | 'typing';
export type Direction = 'incoming' | 'outgoing';
export type Receipt = 'sent' | 'read';
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  bio: string;
  avatar: string | null;
  color: string;
}
export interface Message {
  id: string;
  chatId: string;
  text: string;
  direction: Direction;
  sentAt: string;
  receipt: Receipt;
  edited: boolean;
}
export interface Chat {
  id: string;
  profileId: string;
  presence: Presence;
  unread: number;
  createdAt: string;
}
export interface Document {
  version: 1;
  self: Profile;
  profiles: Profile[];
  chats: Chat[];
  messages: Message[];
}
export type Action =
  | { type: 'profile/save'; profile: Profile }
  | { type: 'self/save'; profile: Profile }
  | { type: 'chat/save'; chat: Chat }
  | { type: 'chat/delete'; id: string }
  | { type: 'chat/read'; id: string }
  | { type: 'message/save'; message: Message }
  | { type: 'message/delete'; id: string };

export const COLORS = ['#5F9BE5', '#E87962', '#9B86D6', '#56BCA1', '#D69A44', '#DC7F9B'];
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const nameOf = (p: Profile) => `${p.firstName} ${p.lastName}`.trim() || 'Без имени';
export const initials = (p: Profile) =>
  [p.firstName, p.lastName]
    .filter(Boolean)
    .map((s) => Array.from(s)[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
export const blankProfile = (): Profile => ({
  id: uid(),
  firstName: '',
  lastName: '',
  username: '',
  phone: '',
  bio: '',
  avatar: null,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
});
export const emptyDocument = (): Document => ({
  version: 1,
  self: { ...blankProfile(), id: 'self', firstName: 'Мой профиль' },
  profiles: [],
  chats: [],
  messages: [],
});

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some((x) => x.id === item.id)
    ? items.map((x) => (x.id === item.id ? item : x))
    : [...items, item];
}
export function reducer(state: Document, action: Action): Document {
  switch (action.type) {
    case 'self/save':
      return { ...state, self: { ...action.profile, id: 'self' } };
    case 'profile/save':
      return { ...state, profiles: upsert(state.profiles, action.profile) };
    case 'chat/save': {
      if (!state.profiles.some((p) => p.id === action.chat.profileId)) return state;
      return {
        ...state,
        chats: upsert(state.chats, {
          ...action.chat,
          unread: Math.max(0, Math.floor(action.chat.unread) || 0),
        }),
      };
    }
    case 'chat/read':
      return {
        ...state,
        chats: state.chats.map((c) => (c.id === action.id ? { ...c, unread: 0 } : c)),
      };
    case 'chat/delete':
      return {
        ...state,
        chats: state.chats.filter((c) => c.id !== action.id),
        messages: state.messages.filter((m) => m.chatId !== action.id),
      };
    case 'message/delete':
      return { ...state, messages: state.messages.filter((m) => m.id !== action.id) };
    case 'message/save': {
      if (
        !state.chats.some((c) => c.id === action.message.chatId) ||
        !action.message.text.trim() ||
        !Number.isFinite(Date.parse(action.message.sentAt))
      )
        return state;
      return {
        ...state,
        messages: upsert(state.messages, { ...action.message, text: action.message.text.trim() }),
      };
    }
  }
}
export function messagesFor(state: Document, chatId: string): Message[] {
  return state.messages
    .filter((m) => m.chatId === chatId)
    .sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt) || a.id.localeCompare(b.id));
}
export function sortedChats(state: Document): Chat[] {
  const last = new Map<string, number>();
  for (const m of state.messages)
    last.set(m.chatId, Math.max(last.get(m.chatId) ?? 0, Date.parse(m.sentAt)));
  return [...state.chats].sort(
    (a, b) =>
      (last.get(b.id) ?? Date.parse(b.createdAt)) - (last.get(a.id) ?? Date.parse(a.createdAt)),
  );
}
const isObject = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object';
const strings = (x: Record<string, unknown>, fields: string[]) =>
  fields.every((k) => typeof x[k] === 'string');
const validProfile = (p: unknown): p is Profile =>
  isObject(p) &&
  strings(p, ['id', 'firstName', 'lastName', 'username', 'phone', 'bio', 'color']) &&
  (p.avatar === null || typeof p.avatar === 'string');
export function decodeDocument(raw: string): Document {
  const x: unknown = JSON.parse(raw);
  if (
    !isObject(x) ||
    x.version !== 1 ||
    !validProfile(x.self) ||
    !Array.isArray(x.profiles) ||
    !x.profiles.every(validProfile) ||
    !Array.isArray(x.chats) ||
    !Array.isArray(x.messages)
  )
    throw new Error('Неподдерживаемый формат данных');
  const profiles = x.profiles;
  if (
    !x.chats.every(
      (c) =>
        isObject(c) &&
        strings(c, ['id', 'profileId', 'createdAt']) &&
        Number.isFinite(Date.parse(c.createdAt as string)) &&
        ['online', 'recently', 'typing'].includes(c.presence as string) &&
        typeof c.unread === 'number' &&
        Number.isInteger(c.unread) &&
        c.unread >= 0 &&
        profiles.some((p) => p.id === c.profileId),
    )
  )
    throw new Error('Повреждены чаты');
  const chats = x.chats as Chat[];
  if (
    !x.messages.every(
      (m) =>
        isObject(m) &&
        strings(m, ['id', 'chatId', 'text', 'sentAt']) &&
        Number.isFinite(Date.parse(m.sentAt as string)) &&
        ['incoming', 'outgoing'].includes(m.direction as string) &&
        ['sent', 'read'].includes(m.receipt as string) &&
        typeof m.edited === 'boolean' &&
        chats.some((c) => c.id === m.chatId),
    )
  )
    throw new Error('Повреждены сообщения');
  for (const list of [profiles, chats, x.messages])
    if (new Set(list.map((i) => i.id)).size !== list.length)
      throw new Error('Повторяющиеся идентификаторы');
  return x as unknown as Document;
}
export function localParts(iso: string) {
  const d = new Date(iso),
    pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}
export function parseLocal(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(d.getTime())) return null;
  const actual = localParts(d.toISOString());
  return actual.date === date && actual.time === time ? d.toISOString() : null;
}
