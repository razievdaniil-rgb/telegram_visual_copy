import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  AccessibilityInfo,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { colors as C, systemFont, type } from './theme';
import { kitAssets } from './kit-assets';

const TargetContext = createContext<React.RefObject<View | null> | null>(null);
export function GlassEnvironment({ children }: { children: React.ReactNode }) {
  const target = useRef<View | null>(null);
  return <TargetContext.Provider value={target}>{children}</TargetContext.Provider>;
}
export function GlassContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const targetRef = useContext(TargetContext);
  const local = useRef<View | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (targetRef) targetRef.current = local.current;
      return () => {
        if (targetRef?.current === local.current) targetRef.current = null;
      };
    }, [targetRef]),
  );
  return (
    <BlurTargetView ref={local} style={[{ flex: 1 }, style]}>
      {children}
    </BlurTargetView>
  );
}
export function Glass({
  children,
  style,
  dark = false,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
}) {
  const targetRef = useContext(TargetContext);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((v) => {
      if (active) setReduced(v);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  const native =
    Platform.OS === 'ios' && !reduced && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  return (
    <View style={[g.glass, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {native ? (
          <GlassView
            colorScheme="light"
            glassEffectStyle="regular"
            style={StyleSheet.absoluteFill}
          />
        ) : reduced ? (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#37779E' : '#F5F5F5' }]}
          />
        ) : (
          <BlurView
            intensity={65}
            tint={dark ? 'dark' : 'light'}
            blurTarget={targetRef ?? undefined}
            blurMethod="dimezisBlurViewSdk31Plus"
            style={StyleSheet.absoluteFill}
          />
        )}
        {!native && !reduced && (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#FFFFFF12' : '#FFFFFF70' }]}
          />
        )}
      </View>
      {children}
    </View>
  );
}
export function KitIcon({
  name,
  color = C.control,
}: {
  name: keyof typeof kitAssets;
  color?: string;
}) {
  return (
    <Image
      source={kitAssets[name]}
      contentFit="contain"
      tintColor={color}
      style={{ width: 28, height: 28 }}
    />
  );
}
export function GlassButton({
  icon,
  title,
  label,
  onPress,
  onLongPress,
  size = 44,
  dark = false,
}: {
  icon?: keyof typeof kitAssets;
  title?: string;
  label: string;
  onPress: () => void;
  onLongPress?: () => void;
  size?: number;
  dark?: boolean;
}) {
  return (
    <Glass dark={dark} style={{ minWidth: size, height: size }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={900}
        style={({ pressed }) => [g.button, { minWidth: size, height: size }, pressed && g.pressed]}
      >
        {icon ? (
          <KitIcon name={icon} color={dark ? 'white' : C.control} />
        ) : (
          <Text
            style={[
              type.body,
              { fontFamily: systemFont, fontWeight: '500', color: dark ? 'white' : C.control },
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Glass>
  );
}
export const unavailable = () => Alert.alert('Недоступно', 'Эта функция недоступна в симуляторе');
export const g = StyleSheet.create({
  glass: {
    borderRadius: 100,
    overflow: 'hidden',
    boxShadow: '0px 8px 40px #0000001F',
    borderWidth: 0.5,
    borderColor: '#FFFFFF70',
  },
  button: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  pressed: { backgroundColor: '#0000000C' },
});
