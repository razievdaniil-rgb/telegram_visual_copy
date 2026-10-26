import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
export function WebGlass({ dark = false }: { dark?: boolean }) {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#FFFFFF20' : '#FFFFFFB3' }]}
    />
  );
}
export const webGlassStyle: StyleProp<ViewStyle> = {};
