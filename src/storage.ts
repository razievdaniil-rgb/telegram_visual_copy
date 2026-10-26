import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeDocument, type Document } from './model';
import { snapshotStorage } from './snapshot';
import { decodePreferences, emptyPreferences, type Preferences } from './preferences-model';
const snapshots = snapshotStorage(AsyncStorage, 'telegram-visual-copy:document:v1');
export async function loadDocument(): Promise<Document | null> {
  const raw = await snapshots.read();
  return raw ? decodeDocument(raw) : null;
}
export function saveDocument(document: Document): Promise<void> {
  const serialized = JSON.stringify(document);
  return snapshots.write(serialized);
}
export async function loadPreferences() {
  const raw = await AsyncStorage.getItem('telegram-visual-copy:preferences:v1');
  return raw === null ? emptyPreferences() : decodePreferences(raw);
}
export const savePreferences = (p: Preferences) =>
  AsyncStorage.setItem('telegram-visual-copy:preferences:v1', JSON.stringify(p));
export async function saveWorkspace(document: Document, preferences: Preferences) {
  await saveDocument(document);
  await savePreferences(preferences);
}
