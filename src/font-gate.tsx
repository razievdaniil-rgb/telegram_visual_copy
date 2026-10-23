import React from 'react';
import { Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';
import { kitFont } from './kit-symbol';
import { Button, Loading } from './ui';

export function FontGate({ children, retry }: { children: React.ReactNode; retry: () => void }) {
  const [ready, error] = useFonts({ ...Ionicons.font, iostgico: kitFont });
  if (error)
    return (
      <View style={{ flex: 1, padding: 28, justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 17, textAlign: 'center' }}>
          Не удалось загрузить ресурсы оформления.
        </Text>
        <Button title="Повторить" onPress={retry} />
      </View>
    );
  if (!ready) return <Loading />;
  return <>{children}</>;
}
