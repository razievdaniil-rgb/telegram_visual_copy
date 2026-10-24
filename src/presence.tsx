import React, { useEffect, useState } from 'react';
import { Animated, AccessibilityInfo, Platform, View, StyleSheet } from 'react-native';
import { Text } from './text';
import { C } from './ui';
import type { Chat } from './model';
export function PresenceLabel({ presence }: { presence: Chat['presence'] }) {
  const [opacity] = useState(() => new Animated.Value(0.35));
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduceMotion(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  useEffect(() => {
    if (presence !== 'typing' || reduceMotion) {
      opacity.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 550,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 550,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [presence, opacity, reduceMotion]);
  if (presence === 'typing')
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        <Animated.Text style={{ opacity, color: C.blue, fontSize: 13 }}>•••</Animated.Text>
        <Text style={st.online}>печатает…</Text>
      </View>
    );
  return (
    <Text style={presence === 'online' ? st.online : st.offline}>
      {presence === 'online' ? 'в сети' : 'был(а) недавно'}
    </Text>
  );
}
const st = StyleSheet.create({
  online: { color: C.blue, fontSize: 13, lineHeight: 15 },
  offline: { color: C.muted, fontSize: 13, lineHeight: 15 },
});
