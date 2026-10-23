import React from 'react';
import { Platform, Text } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { colors as C } from './theme';
import { kitAssets } from './kit-assets';

export const kitFont = require('../assets/telegram/iostgico-monochrome.ttf');
// Codepoints are copied from the high-fidelity Figma contexts, not inferred from icon names.
export const kitSymbols = {
  contacts: '\uF0CD',
  calls: '\uF227',
  chats: '\uF297',
  settings: '\uF289',
  story: '\uF208',
  compose: '\uF26E',
  attach: '\uF0E9',
  emoji: '\uF05A',
  mic: '\uF282',
  read: '\uF1BD',
  video: '\uF192',
  mute: '\uF0BC',
  search: '\uF07A',
  more: '\uF097',
  qr: '\uF1FC',
  emojiStatus: '\uF05E',
  photo: '\uF239',
  plus: '\uF265',
  profile: '\uF017',
  wallet: '\uF129',
  saved: '\uF22E',
  recentCalls: '\uF002',
  devices: '\uF0A6',
  folders: '\uF220',
  notifications: '\uF219',
  privacy: '\uF0EC',
  data: '\uF20B',
  appearance: '\uF204',
  power: '\uF19B',
  language: '\uF1FD',
  premium: '\uF22D',
  stars: '\uF22D',
  gift: '\uF230',
  question: '\uF1F6',
  faq: '\uF1EE',
  features: '\uF264',
  invite: '\uF1A4',
} as const;
export type KitSymbolName = keyof typeof kitSymbols;
export function KitSymbol({
  name,
  size = 28,
  color = C.control,
}: {
  name: KitSymbolName;
  size?: number;
  color?: string;
}) {
  return (
    <Text
      aria-hidden
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
      allowFontScaling={false}
      style={{
        fontFamily: 'iostgico',
        fontSize: size,
        lineHeight: size,
        width: size,
        height: size,
        includeFontPadding: false,
        textAlign: 'center',
        color,
        fontWeight: '400',
        letterSpacing: 0,
      }}
    >
      {kitSymbols[name]}
    </Text>
  );
}
export function SystemSymbol({
  name,
  color = C.control,
  size = 20,
}: {
  name: 'back' | 'search' | 'close' | 'forward';
  color?: string;
  size?: number;
}) {
  const names = {
    back: 'chevron.backward',
    search: 'magnifyingglass',
    close: 'xmark',
    forward: 'chevron.forward',
  } as const;
  if (Platform.OS === 'ios')
    return (
      <SymbolView
        name={names[name]}
        tintColor={color}
        size={size}
        weight="medium"
        style={{ width: size, height: size }}
      />
    );
  if (name === 'search') return <KitSymbol name="search" size={size + 4} color={color} />;
  if (name === 'back' || name === 'forward')
    return (
      <Image
        source={kitAssets.back}
        tintColor={color}
        contentFit="contain"
        style={{ width: 28, height: 28, transform: [{ scaleX: name === 'forward' ? -1 : 1 }] }}
      />
    );
  return (
    <Text
      aria-hidden
      accessible={false}
      allowFontScaling={false}
      style={{ fontSize: size + 4, lineHeight: size + 4, color }}
    >
      ×
    </Text>
  );
}
