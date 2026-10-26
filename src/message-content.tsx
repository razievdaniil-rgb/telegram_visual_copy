import React, { useCallback, useState } from 'react';
import { PixelRatio, StyleSheet, View } from 'react-native';
import { Text } from './text';
import type { Message } from './model';
import { MessageBubble } from './message-bubble';
import { MessageChecks, timeLabel } from './message-ui';
import { TextMeasure, type TextMetrics } from './text-measure';
import { colors as C, systemFont, type } from './theme';
import { usePreferences } from './preferences';
import { messageGeometry } from './message-geometry';

// ChatMessageTextBubbleContentNode + DateAndStatusNode, text-only branch:
// 1. Lay out plain text at the constraint (date is NOT part of that string).
// 2. Expand to fit last-line width + date when possible; otherwise add a date row.
export function MessageContent({
  message,
  maxWidth,
  previous,
  next,
}: {
  message: Message;
  maxWidth: number;
  previous: boolean;
  next: boolean;
}) {
  const { preferences } = usePreferences();
  const messageText = {
    ...s.text,
    fontSize: preferences.fontSize,
    lineHeight: preferences.fontSize + 5,
  };
  const outgoing = message.direction === 'outgoing';
  const constraint = Math.max(12, maxWidth - 28);
  const [metrics, setMetrics] = useState<TextMetrics | null>(null);
  const [dateWidth, setDateWidth] = useState(0);
  const measure = useCallback((value: TextMetrics) => {
    setMetrics((old) =>
      old &&
      Object.keys(value).every(
        (key) => Math.abs(old[key as keyof TextMetrics] - value[key as keyof TextMetrics]) < 0.1,
      )
        ? old
        : value,
    );
  }, []);
  const meta = `${message.edited ? 'изменено ' : ''}${timeLabel(message.sentAt)}`;
  const metaColor = outgoing ? C.outgoingMeta : C.incomingMeta;
  const rtl = /[\u0590-\u08ff]/.test(message.text.split('\n').at(-1) ?? '');
  const geometry = metrics
    ? messageGeometry(
        constraint,
        metrics.width,
        metrics.lastWidth,
        dateWidth + 5 + (outgoing ? 13 : 0),
        rtl,
      )
    : { width: constraint, dateRowHeight: 13 };
  const contentWidth = geometry.width;
  const metadata = (
    <>
      <Text style={[s.metaText, { color: metaColor }]}>{meta}</Text>
      {outgoing && <MessageChecks receipt={message.receipt} color={C.outgoingCheck} />}
    </>
  );
  return (
    <View style={s.row}>
      <TextMeasure text={message.text} width={constraint} style={messageText} onMeasure={measure} />
      <Text
        aria-hidden
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        onLayout={({ nativeEvent: { layout } }) => setDateWidth(layout.width)}
        style={[s.metaText, s.probe]}
      >
        {meta}
      </Text>
      <MessageBubble
        outgoing={outgoing}
        previous={previous}
        next={next}
        maxWidth={maxWidth}
        width={contentWidth + 28}
      >
        <View style={{ width: contentWidth }}>
          <Text
            selectable
            textBreakStrategy="simple"
            lineBreakStrategyIOS="none"
            style={[
              messageText,
              { width: contentWidth, paddingBottom: geometry.dateRowHeight, marginBottom: -2 },
            ]}
          >
            {message.text}
          </Text>
          <View pointerEvents="none" style={[s.meta, s.date, { right: outgoing ? -5 : 0 }]}>
            {metadata}
          </View>
        </View>
      </MessageBubble>
    </View>
  );
}
const s = StyleSheet.create({
  row: { alignSelf: 'stretch' },
  text: {
    ...type.message,
    fontFamily: systemFont,
    fontWeight: '400',
    color: C.text,
    includeFontPadding: false,
  },
  meta: { flexDirection: 'row', gap: 1, alignItems: 'center' },
  probe: { position: 'absolute', left: 0, top: 0, opacity: 0 },
  date: { position: 'absolute', bottom: -(1 - 1 / PixelRatio.get()) },
  metaText: { fontFamily: systemFont, fontSize: 11, lineHeight: 13, includeFontPadding: false },
});
