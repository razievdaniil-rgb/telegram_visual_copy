import React from 'react';
import { View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
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
  compact?: boolean;
}) {
  return (
    <View accessibilityLabel={receipt === 'read' ? 'Прочитано' : 'Отправлено'}>
      <Svg width={receipt === 'read' ? 17 : 11} height={9}>
        <G
          transform="translate(1 1)"
          stroke={color}
          strokeWidth={0.99}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <Path d="M0 4 L2.95157047 6.95157047 C2.97734507 6.97734507 3.01913396 6.97734507 3.04490857 6.95157047 L9.5 0" />
          {receipt === 'read' && <Path transform="translate(6 0)" d="M0.5 7 L7 0" />}
        </G>
      </Svg>
    </View>
  );
}
