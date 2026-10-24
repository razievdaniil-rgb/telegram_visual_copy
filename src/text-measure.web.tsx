import React, { useLayoutEffect, useRef } from 'react';
import { Text } from 'react-native';
import type { TextMeasureProps } from './text-measure';

// react-native-web does not implement onTextLayout. Read the browser's actual
// line rectangles instead of estimating character widths or splitting words.
export function TextMeasure({ text, width, style, onMeasure }: TextMeasureProps) {
  const ref = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const range = document.createRange();
      range.selectNodeContents(element);
      const rects = Array.from(range.getClientRects());
      const rows = new Map<number, number>();
      for (const rect of rects) {
        const y = Math.round(rect.top * 10) / 10;
        rows.set(y, (rows.get(y) ?? 0) + rect.width);
      }
      const widths = [...rows.values()];
      onMeasure({
        width: Math.max(0, ...widths),
        lastWidth: text.endsWith('\n') ? 0 : (widths.at(-1) ?? 0),
        height: element.getBoundingClientRect().height,
        lines: Math.max(1, widths.length),
      });
    };
    measure();
    void document.fonts.ready.then(measure);
    return () => {
      active = false;
    };
  }, [text, width, style, onMeasure]);
  return (
    <Text
      ref={(node) => {
        ref.current = node as unknown as HTMLElement;
      }}
      aria-hidden
      pointerEvents="none"
      style={[style, { position: 'absolute', width, opacity: 0, left: 0, top: 0 }]}
    >
      {text}
    </Text>
  );
}
