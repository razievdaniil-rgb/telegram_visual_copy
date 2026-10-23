import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Standard 13.1.1 wallpaper: original bundled mask, phase-0 software gradient.
// Extend the image behind the OS safe area; headers do not restart the pattern.
export function Wallpaper({ root = false }: { root?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { top: root ? 0 : -insets.top, overflow: 'hidden', backgroundColor: '#DBDDBB' },
      ]}
    >
      <Image
        source={require('../assets/telegram-ios/wallpaper-gradient.png')}
        contentFit="fill"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { mixBlendMode: 'soft-light', opacity: 0.5 }]}>
        <Image
          source={require('../assets/telegram-ios/wallpaper-pattern.png')}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}
