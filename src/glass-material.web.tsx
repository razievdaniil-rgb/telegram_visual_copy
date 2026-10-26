import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
export function WebGlass({ dark = false }: { dark?: boolean }) {
  return (
    <View
      testID="glass"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: dark ? '#FFFFFF20' : '#FFFFFF8C',
          backdropFilter: 'blur(24px) saturate(1.65)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.65)',
          borderRadius: 'inherit',
          borderWidth: 0.5,
          borderColor: dark ? '#FFFFFF33' : '#FFFFFF99',
        } as unknown as ViewStyle,
      ]}
    />
  );
}
export const webGlassStyle = { isolation: 'isolate' } as unknown as ViewStyle;
