import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeDocument, type Document } from './model';
import { decodePreferences, emptyPreferences, type Preferences } from './preferences-model';
import { snapshotStorage } from './snapshot';
import { BrowserDatabase } from './browser-database';
let database: BrowserDatabase;
const db = () => (database ??= new BrowserDatabase(window.indexedDB));
let queue = Promise.resolve();
function write(entries: [string, string][]) {
  const job = queue.catch(() => undefined).then(() => db().write(entries));
  queue = job;
  return job;
}
export async function loadDocument(): Promise<Document | null> {
  const legacy = snapshotStorage(AsyncStorage, 'telegram-visual-copy:document:v1');
  const raw = await db().migrateDocument(() => legacy.read(), decodeDocument);
  return raw === null ? null : decodeDocument(raw);
}
export const saveDocument = (document: Document) => write([['document', JSON.stringify(document)]]);
export async function loadPreferences() {
  const raw = await db().read('preferences');
  return raw === null ? emptyPreferences() : decodePreferences(raw);
}
export const savePreferences = (preferences: Preferences) =>
  write([['preferences', JSON.stringify(preferences)]]);
export const saveWorkspace = (document: Document, preferences: Preferences) =>
  write([
    ['document', JSON.stringify(document)],
    ['preferences', JSON.stringify(preferences)],
  ]);
