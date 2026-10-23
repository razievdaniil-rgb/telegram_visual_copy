import React from 'react';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { colors } from './theme';

// Telegram-iOS 13.1.1, fb0e62ba8a147f0821da6aa63c09da7d79a10111.
// Vector frames and PDFs retain their original geometry; the app applies tint,
// just as UIImage.alwaysTemplate and LottieComponent do upstream.
const icons = {
  newCall: { source: require('../assets/telegram-ios/new-call.svg'), size: 24 },
  disclosure: { source: require('../assets/telegram-ios/disclosure.svg'), size: 24 },
  add: { source: require('../assets/telegram-ios/add.svg'), size: 30 },
  invite: { source: require('../assets/telegram-ios/invite.svg'), size: 30 },
  chats: { source: require('../assets/telegram-ios/TabChats.svg'), size: 48 },
  calls: { source: require('../assets/telegram-ios/TabCalls.svg'), size: 48 },
  contacts: { source: require('../assets/telegram-ios/TabContacts.svg'), size: 48 },
  settings: { source: require('../assets/telegram-ios/TabSettings.svg'), size: 48 },
  compose: { source: require('../assets/telegram-ios/compose.svg'), size: 30 },
  send: { source: require('../assets/telegram-ios/send.svg'), size: 30 },
  call: { source: require('../assets/telegram-ios/profile-call.svg'), size: 40 },
  video: { source: require('../assets/telegram-ios/profile-video.svg'), size: 30 },
  search: { source: require('../assets/telegram-ios/profile-search.svg'), size: 40 },
  mute: { source: require('../assets/telegram-ios/profile-mute.svg'), size: 40 },
  more: { source: require('../assets/telegram-ios/profile-more.svg'), size: 40 },
  message: { source: require('../assets/telegram-ios/profile-message.svg'), size: 40 },
  attachment: { source: require('../assets/telegram-ios/attachment.png'), size: 30 },
  microphone: { source: require('../assets/telegram-ios/microphone.png'), size: 30 },
  sticker: { source: require('../assets/telegram-ios/sticker.png'), size: 24 },
} as const;
export type TelegramIconName = keyof typeof icons;
export function TelegramIcon({
  name,
  color = colors.control,
  frame,
}: {
  name: TelegramIconName;
  color?: string;
  frame?: number;
}) {
  const asset = icons[name];
  const size = frame ?? asset.size;
  return (
    <View
      pointerEvents="none"
      accessible={false}
      aria-hidden
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Image
        source={asset.source}
        contentFit="contain"
        tintColor={color}
        style={{ width: asset.size, height: asset.size }}
      />
    </View>
  );
}
