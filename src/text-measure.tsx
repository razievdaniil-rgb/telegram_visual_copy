import React from 'react';
import { type TextStyle } from 'react-native';
import { Text } from './text';

export type TextMetrics = { width: number; lastWidth: number; height: number; lines: number };
export type TextMeasureProps = {
  text: string;
  width: number;
  style: TextStyle;
  onMeasure: (metrics: TextMetrics) => void;
};

// Measure the message by itself, at the available width, before placing its date.
// Telegram's TextNode uses CTTypesetterSuggestLineBreak, not balanced paragraphs.
export function TextMeasure({ text, width, style, onMeasure }: TextMeasureProps) {
  return (
    <Text
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      textBreakStrategy="simple"
      lineBreakStrategyIOS="none"
      onTextLayout={({ nativeEvent: { lines } }) => {
        if (!lines.length) return;
        onMeasure({
          width: Math.max(...lines.map((line) => line.width)),
          lastWidth: lines[lines.length - 1].width,
          height: Math.max(...lines.map((line) => line.y + line.height)),
          lines: lines.length,
        });
      }}
      style={[style, { position: 'absolute', width, opacity: 0, left: 0, top: 0 }]}
    >
      {text}
    </Text>
  );
}
