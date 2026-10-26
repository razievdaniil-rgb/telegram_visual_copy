import React, { createContext, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from './text';
import { Button, Loading } from './ui';
import { emptyPreferences, type Preferences } from './preferences-model';
import { loadPreferences, savePreferences } from './storage';
const Context = createContext<{
  preferences: Preferences;
  change: (update: (p: Preferences) => Preferences) => void;
  replace: (p: Preferences) => void;
} | null>(null);
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void loadPreferences()
      .then((p) => {
        if (active) {
          setPreferences(p);
          setReady(true);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Не удалось открыть настройки');
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    void savePreferences(preferences)
      .then(() => {
        if (active) setError('');
      })
      .catch(() => {
        if (active) setError('Не удалось сохранить настройки');
      });
    return () => {
      active = false;
    };
  }, [ready, preferences]);
  if (!ready)
    return error ? (
      <View style={{ padding: 24 }}>
        <Text>{error}</Text>
        <Button title="Повторить" onPress={() => setAttempt((a) => a + 1)} />
      </View>
    ) : (
      <Loading />
    );
  return (
    <Context.Provider value={{ preferences, change: setPreferences, replace: setPreferences }}>
      {error ? (
        <View style={{ padding: 10, backgroundColor: '#FFE4DF' }}>
          <Text>{error}</Text>
          <Button title="Повторить сохранение" onPress={() => setPreferences({ ...preferences })} />
        </View>
      ) : null}
      {children}
    </Context.Provider>
  );
}
export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error('PreferencesProvider is missing');
  return value;
}
