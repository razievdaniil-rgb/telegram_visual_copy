import React from 'react';
import { Text } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors as C } from './theme';

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
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" accessible={false}>
      {name === 'search' ? (
        <>
          <Circle cx="8.4" cy="8.4" r="5.8" fill="none" stroke={color} strokeWidth="1.8" />
          <Path d="M12.7 12.7L17.6 17.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <Path
          d={
            name === 'close'
              ? 'M4.2 4.2L15.8 15.8M15.8 4.2L4.2 15.8'
              : name === 'back'
                ? 'M12.5 2.5L5 10L12.5 17.5'
                : 'M7.5 2.5L15 10L7.5 17.5'
          }
          fill="none"
          stroke={color}
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}
