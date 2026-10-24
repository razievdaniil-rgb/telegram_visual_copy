import React, { forwardRef } from 'react';
import {
  Platform,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  type TextProps,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { colors, systemFont } from './theme';

// Resolve each bundled static face explicitly: Android cannot infer an Expo
// runtime font family's weights from four unrelated asset aliases.
function textStyle(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const resolved = StyleSheet.flatten(style);
  if (resolved?.fontFamily && resolved.fontFamily !== systemFont) return style;
  if (Platform.OS === 'ios') return [{ fontFamily: systemFont }, style];
  const weight = resolved?.fontWeight;
  const numeric = weight === 'bold' ? 700 : Number(weight) || 400;
  const face =
    numeric >= 700 ? 'Bold' : numeric >= 600 ? 'SemiBold' : numeric >= 500 ? 'Medium' : 'Regular';
  return [{ includeFontPadding: false }, style, { fontFamily: `Inter-${face}`, fontWeight: '400' }];
}

export const Text = forwardRef<NativeText, TextProps>(function Text({ style, ...props }, ref) {
  return <NativeText {...props} ref={ref} style={textStyle(style)} />;
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(function TextInput(
  { style, ...props },
  ref,
) {
  return (
    <NativeTextInput
      underlineColorAndroid="transparent"
      selectionColor={colors.blue}
      cursorColor={colors.blue}
      {...props}
      ref={ref}
      style={textStyle(style)}
    />
  );
});
