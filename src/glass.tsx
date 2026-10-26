import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  AccessibilityInfo,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text } from './text';
import { BlurTargetView, BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { colors as C, systemFont, type } from './theme';
import { kitAssets } from './kit-assets';
import { Icon } from './ui';
import { KitSymbol, SystemSymbol, type KitSymbolName } from './kit-symbol';
import { TelegramIcon, type TelegramIconName } from './telegram-assets';
import { WebGlass, webGlassStyle } from './glass-material';

const TargetContext = createContext<{
  targetRef?: React.RefObject<View | null>;
  registerTarget?: (node: View | null) => () => void;
}>({});
const NoticeContext = createContext<(title: string, message: string) => void>((title, message) =>
  Alert.alert(title, message),
);
export function GlassEnvironment({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const showNotice = useCallback((title: string, message: string) => {
    setNotice({ title, message });
  }, []);
  const [targetRef, setTargetRef] = useState<React.RefObject<View | null>>();
  const registerTarget = useCallback((node: View | null) => {
    setTargetRef(node ? { current: node } : undefined);
    return () => setTargetRef((previous) => (previous?.current === node ? undefined : previous));
  }, []);
  return (
    <NoticeContext.Provider value={showNotice}>
      <TargetContext.Provider value={{ targetRef, registerTarget }}>
        {children}
        <Modal
          visible={notice !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setNotice(null)}
        >
          <View style={g.noticeBackdrop}>
            <View accessibilityViewIsModal style={g.notice}>
              <Text style={g.noticeTitle}>{notice?.title}</Text>
              <Text style={g.noticeText}>{notice?.message}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="РџРѕРЅСЏС‚РЅРѕ"
                onPress={() => setNotice(null)}
                style={g.noticeButton}
              >
                <Text style={{ color: C.blue, fontSize: 17, fontWeight: '600' }}>
                  РџРѕРЅСЏС‚РЅРѕ
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </TargetContext.Provider>
    </NoticeContext.Provider>
  );
}
export function GlassContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { registerTarget } = useContext(TargetContext);
  const local = useRef<View | null>(null);
  useFocusEffect(
    useCallback(() => {
      return registerTarget?.(local.current);
    }, [registerTarget]),
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
  capture = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
  capture?: boolean;
}) {
  const { targetRef } = useContext(TargetContext);
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
    <View style={[g.glass, webGlassStyle, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Platform.OS === 'web' ? (
          <WebGlass dark={dark} />
        ) : native ? (
          <GlassView
            colorScheme="light"
            glassEffectStyle={dark ? 'clear' : 'regular'}
            style={StyleSheet.absoluteFill}
          />
        ) : reduced ? (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#37779E' : '#F5F5F5' }]}
          />
        ) : (
          <BlurView
            intensity={dark ? 25 : 65}
            tint={dark ? 'default' : 'light'}
            blurTarget={capture ? targetRef : undefined}
            blurMethod={capture ? 'dimezisBlurViewSdk31Plus' : 'none'}
            style={StyleSheet.absoluteFill}
          />
        )}
        {Platform.OS !== 'web' && !native && !reduced && (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#FFFFFF12' : '#FFFFFFB3' }]}
          />
        )}
        {!native && (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 100,
                borderWidth: 0.5,
                borderColor: dark ? '#FFFFFF26' : '#0000000A',
              },
            ]}
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
  symbol,
  telegramIcon,
  fallbackIcon,
  title,
  label,
  onPress,
  onLongPress,
  size = 44,
  dark = false,
}: {
  icon?: keyof typeof kitAssets | 'close';
  symbol?: KitSymbolName;
  telegramIcon?: TelegramIconName;
  fallbackIcon?: React.ComponentProps<typeof Icon>['name'];
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
        {telegramIcon ? (
          <TelegramIcon name={telegramIcon} color={dark ? 'white' : C.control} />
        ) : symbol ? (
          <KitSymbol name={symbol} size={30} color={dark ? 'white' : C.control} />
        ) : icon === 'back' || icon === 'search' || icon === 'close' ? (
          <SystemSymbol name={icon} color={dark ? 'white' : C.control} />
        ) : fallbackIcon ? (
          <Icon name={fallbackIcon} size={28} color={dark ? 'white' : C.control} />
        ) : icon ? (
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
export function useNotice() {
  return useContext(NoticeContext);
}
export function useUnavailable() {
  const showNotice = useNotice();
  return () =>
    showNotice(
      'РќРµРґРѕСЃС‚СѓРїРЅРѕ',
      'Р­С‚Р° С„СѓРЅРєС†РёСЏ РЅРµРґРѕСЃС‚СѓРїРЅР° РІ СЃРёРјСѓР»СЏС‚РѕСЂРµ',
    );
}
export const g = StyleSheet.create({
  noticeBackdrop: {
    flex: 1,
    backgroundColor: '#00000050',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notice: {
    width: '100%',
    maxWidth: 270,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    overflow: 'hidden',
  },
  noticeTitle: {
    ...type.body,
    fontFamily: systemFont,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 20,
  },
  noticeText: { ...type.footnote, fontFamily: systemFont, textAlign: 'center', padding: 16 },
  noticeButton: {
    height: 44,
    borderTopColor: C.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glass: {
    borderRadius: 100,
    overflow: 'hidden',
    boxShadow: '0px 1px 30px rgba(0,0,0,0.045)',
  },
  button: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  pressed: { backgroundColor: '#0000000C' },
});
