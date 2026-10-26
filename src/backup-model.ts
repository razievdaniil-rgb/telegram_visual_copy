import { decodeDocument, type Document } from './model.ts';
import { decodePreferences, type Preferences } from './preferences-model.ts';
export function encodeBackup(document: Document, preferences: Preferences) {
  return JSON.stringify({ kind: 'telegram-simulator-backup', version: 1, document, preferences });
}
export function decodeBackup(raw: string): { document: Document; preferences: Preferences } {
  const value = JSON.parse(raw);
  if (value?.kind !== 'telegram-simulator-backup' || value.version !== 1)
    throw new Error('Неизвестный формат резервной копии');
  return {
    document: decodeDocument(JSON.stringify(value.document)),
    preferences: decodePreferences(JSON.stringify(value.preferences)),
  };
}
