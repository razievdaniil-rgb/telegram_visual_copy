import React from 'react';
import { Image } from 'expo-image';
const icons = {
  profile: require('../assets/telegram-ios/settings-profile.png'),
  saved: require('../assets/telegram-ios/settings-saved.png'),
  recentCalls: require('../assets/telegram-ios/settings-recentCalls.png'),
  devices: require('../assets/telegram-ios/settings-devices.png'),
  folders: require('../assets/telegram-ios/settings-folders.png'),
  notifications: require('../assets/telegram-ios/settings-notifications.png'),
  privacy: require('../assets/telegram-ios/settings-privacy.png'),
  data: require('../assets/telegram-ios/settings-data.png'),
  appearance: require('../assets/telegram-ios/settings-appearance.png'),
  power: require('../assets/telegram-ios/settings-power.png'),
  language: require('../assets/telegram-ios/settings-language.png'),
  premium: require('../assets/telegram-ios/settings-premium.png'),
  stars: require('../assets/telegram-ios/settings-stars.png'),
  business: require('../assets/telegram-ios/settings-business.png'),
  gift: require('../assets/telegram-ios/settings-gift.png'),
  question: require('../assets/telegram-ios/settings-question.png'),
  faq: require('../assets/telegram-ios/settings-faq.png'),
  features: require('../assets/telegram-ios/settings-features.png'),
};
export type SettingsIconName = keyof typeof icons;
export function SettingsIcon({ name }: { name: SettingsIconName }) {
  return (
    <Image accessible={false} aria-hidden source={icons[name]} style={{ width: 29, height: 29 }} />
  );
}
