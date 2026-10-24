import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './text';
import { emptyDocument, reducer, type Action, type Document } from './model';
import { loadDocument, saveDocument } from './storage';
import { Button, Empty, Loading } from './ui';
import { exampleDocument } from './example';

type StoreAction = Action | { type: 'document/load'; document: Document };
const Store = createContext<null | { data: Document; dispatch: React.Dispatch<StoreAction> }>(null);
const storeReducer = (state: Document, action: StoreAction) =>
  action.type === 'document/load' ? action.document : reducer(state, action);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(storeReducer, undefined, emptyDocument);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loadAttempt, retryLoad] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    let active = true;
    void loadDocument()
      .then((document) => {
        if (!active) return;
        if (document) dispatch({ type: 'document/load', document });
        else if (process.env.EXPO_PUBLIC_VISUAL_TEST === '1')
          dispatch({ type: 'document/load', document: exampleDocument() });
        setLoadError(false);
        setReady(true);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);
  useEffect(() => {
    if (!ready) return;
    let current = true;
    void saveDocument(data)
      .then(() => {
        if (current) setSaveError(false);
      })
      .catch(() => {
        if (current) setSaveError(true);
      });
    return () => {
      current = false;
    };
  }, [data, ready]);
  if (!ready)
    return loadError ? (
      <View style={{ flex: 1, padding: 24 }}>
        <Empty
          title="Не удалось открыть данные"
          description="Хранилище недоступно или данные повреждены. Сохранённая переписка не перезаписана."
          icon="alert-circle-outline"
        />
        <Button title="Попробовать снова" onPress={() => retryLoad()} />
      </View>
    ) : (
      <Loading />
    );
  return (
    <Store.Provider value={{ data, dispatch }}>
      {saveError && (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void saveDocument(data)
              .then(() => setSaveError(false))
              .catch(() => setSaveError(true));
          }}
          style={{ padding: 10, backgroundColor: '#FFE4DF' }}
        >
          <Text style={{ color: '#A02B21', textAlign: 'center' }}>
            Не удалось сохранить изменения. Нажмите, чтобы повторить.
          </Text>
        </Pressable>
      )}
      {children}
    </Store.Provider>
  );
}
export function useStore() {
  const context = useContext(Store);
  if (!context) throw new Error('StoreProvider is missing');
  return context;
}
