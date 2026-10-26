import { nameOf, sortedChats, type Document } from './model.ts';
export type Folder = { id: string; title: string; chatIds: string[] };
export type Preferences = {
  version: 1;
  archived: string[];
  pinned: string[];
  folders: Folder[];
  fontSize: number;
  wallpaper: 'telegram' | 'plain' | 'blue';
};
export const emptyPreferences = (): Preferences => ({
  version: 1,
  archived: [],
  pinned: [],
  folders: [],
  fontSize: 17,
  wallpaper: 'telegram',
});
export function decodePreferences(raw: string): Preferences {
  const p = JSON.parse(raw) as Preferences;
  const ids = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((id) => typeof id === 'string') && new Set(v).size === v.length;
  if (
    !p ||
    p.version !== 1 ||
    !ids(p.archived) ||
    !ids(p.pinned) ||
    !Array.isArray(p.folders) ||
    !p.folders.every(
      (f) =>
        f &&
        typeof f.id === 'string' &&
        typeof f.title === 'string' &&
        f.title.trim().length > 0 &&
        f.title.length <= 40 &&
        ids(f.chatIds),
    ) ||
    new Set(p.folders.map((f) => f.id)).size !== p.folders.length ||
    ![15, 16, 17, 18, 19, 20, 21, 22].includes(p.fontSize) ||
    !['telegram', 'plain', 'blue'].includes(p.wallpaper)
  )
    throw new Error('Некорректные настройки');
  return p;
}
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
export function visibleChats(data: Document, preferences: Preferences, folder = 'all') {
  const membership = preferences.folders.find((f) => f.id === folder)?.chatIds;
  return sortedChats(data)
    .filter((c) =>
      folder === 'archive'
        ? preferences.archived.includes(c.id)
        : !preferences.archived.includes(c.id) && (!membership || membership.includes(c.id)),
    )
    .sort(
      (a, b) =>
        Number(preferences.pinned.includes(b.id)) - Number(preferences.pinned.includes(a.id)),
    );
}
export function searchMessages(data: Document, query: string) {
  const q = query.trim().toLocaleLowerCase('ru');
  if (!q) return [];
  return [...data.messages]
    .filter((m) => m.text.toLocaleLowerCase('ru').includes(q))
    .sort((a, b) => Date.parse(b.sentAt) - Date.parse(a.sentAt));
}
export function searchChats(data: Document, query: string) {
  const q = query.trim().toLocaleLowerCase('ru');
  return sortedChats(data).filter((c) =>
    nameOf(data.profiles.find((p) => p.id === c.profileId)!)
      .toLocaleLowerCase('ru')
      .includes(q),
  );
}
