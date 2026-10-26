import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { usePreferences } from './preferences';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Vector mask aligned to the bundled iOS preview; phase-0 software gradient.
// Extend the image behind the OS safe area; headers do not restart the pattern.
export function Wallpaper({ root = false }: { root?: boolean }) {
  const { preferences } = usePreferences();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          top: root ? 0 : -insets.top,
          bottom: undefined,
          height:
            Platform.OS === 'web' ? ('var(--screen-height, 100lvh)' as unknown as number) : height,
          overflow: 'hidden',
          backgroundColor: '#DBDDBB',
        },
      ]}
    >
      {preferences.wallpaper === 'telegram' ? (
        <>
          <Image
            source={require('../assets/telegram-ios/wallpaper-gradient.png')}
            contentFit="fill"
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { mixBlendMode: 'soft-light', opacity: 0.5 }]}>
            <Image
              source={require('../assets/telegram-ios/original/wallpaper-full-web.svg')}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
            />
          </View>
        </>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: preferences.wallpaper === 'blue' ? '#CBE3F1' : '#E1E8D4' },
          ]}
        />
      )}
    </View>
  );
}
