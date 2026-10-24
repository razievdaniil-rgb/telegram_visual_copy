import React, { useId, useState } from 'react';
import { View, StyleSheet, PixelRatio } from 'react-native';
import Svg, { Defs, Mask, Rect, Ellipse, Path, G } from 'react-native-svg';
import { colors, layout } from './theme';

// Port of TelegramPresentationData/ChatMessageBubbleImages.swift.
// The tail is the same pair of quadratic curves minus an ellipse. It is part
// of one mask with the body, so grouped corners cannot leave seams or halos.
export function MessageBubble({
  outgoing,
  previous,
  next,
  maxWidth,
  width,
  children,
}: {
  outgoing: boolean;
  previous: boolean;
  next: boolean;
  maxWidth: number;
  width?: number;
  children: React.ReactNode;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const id = `bubble${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const w = Math.max(34, size.width - 6),
    h = Math.max(35, size.height);
  const r = layout.bubble,
    tr = previous ? layout.mergedBubble : r,
    br = next ? layout.mergedBubble : r;
  const body = `M ${r} 0 H ${w - tr} A ${tr} ${tr} 0 0 1 ${w} ${tr} V ${h - br} A ${br} ${br} 0 0 1 ${w - br} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${h - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
  return (
    <View
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
      }}
      style={[
        styles.bubble,
        {
          maxWidth,
          width,
          alignSelf: outgoing ? 'flex-end' : 'flex-start',
          marginBottom: next ? 0 : 2 + 1 / PixelRatio.get(),
          paddingLeft: outgoing ? 11 : 17,
          paddingRight: outgoing ? 17 : 11,
        },
      ]}
    >
      {size.width > 0 && (
        <Svg pointerEvents="none" width={size.width} height={h} style={StyleSheet.absoluteFill}>
          <Defs>
            <Mask id={id} x="0" y="0" width={size.width} height={h} maskUnits="userSpaceOnUse">
              <G transform={outgoing ? undefined : `translate(${size.width} 0) scale(-1 1)`}>
                <Path d={body} fill="white" />
                {!next && (
                  <>
                    <Path
                      d={`M ${w - 9} ${h - 8.5} Q ${w - 9} ${h} ${w + 4.5} ${h} Q ${w + 18} ${h} ${w + 18} ${h - 8.5} Z`}
                      fill="white"
                    />
                    <Rect x={w - 16.5} y={h - 17} width={16.5} height={9} fill="white" />
                    <Ellipse cx={w + 11.5} cy={h - 8.5} rx={11.5} ry={10.5} fill="black" />
                  </>
                )}
              </G>
            </Mask>
          </Defs>
          <Rect
            width={size.width}
            height={h}
            fill={outgoing ? colors.outgoing : colors.incoming}
            mask={`url(#${id})`}
          />
        </Svg>
      )}
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  bubble: {
    minWidth: 40,
    minHeight: 35,
    paddingTop: 6 + 1 / PixelRatio.get(),
    paddingBottom: 6 - 1 / PixelRatio.get(),
  },
});
