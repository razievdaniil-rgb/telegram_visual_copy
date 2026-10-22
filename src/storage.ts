import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeDocument, type Document } from './model';
import { snapshotStorage } from './snapshot';
const snapshots = snapshotStorage(AsyncStorage, 'telegram-visual-copy:document:v1');
export async function loadDocument(): Promise<Document | null> {
  const raw = await snapshots.read();
  return raw ? decodeDocument(raw) : null;
}
export function saveDocument(document: Document): Promise<void> {
  const serialized = JSON.stringify(document);
  return snapshots.write(serialized);
}
