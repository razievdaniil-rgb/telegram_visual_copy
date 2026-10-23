import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { kitAssets } from './kit-assets';
import { colors as C } from './theme';
import type { Message } from './model';

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
export const dayKey = (iso: string) => new Date(iso).toLocaleDateString('ru-RU');
export function listTime(iso: string) {
  return dayKey(iso) === dayKey(new Date().toISOString())
    ? timeLabel(iso)
    : new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: '2-digit' });
}
export function MessageChecks({
  receipt,
  color = C.outgoingMeta,
}: {
  receipt: Message['receipt'];
  color?: string;
}) {
  return (
    <View accessibilityLabel={receipt === 'read' ? 'Прочитано' : 'Отправлено'}>
      {receipt === 'read' ? (
        <Image
          source={kitAssets.read}
          tintColor={color}
          contentFit="contain"
          style={{ width: 17.4991, height: 10.0485 }}
        />
      ) : (
        <Text style={{ color, fontSize: 13, lineHeight: 13 }}>✓</Text>
      )}
    </View>
  );
}
