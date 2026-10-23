import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass, GlassButton, KitIcon } from './glass';
import { colors as C, systemFont, type } from './theme';
import { Icon } from './ui';

export function PublicHeader({
  title,
  leading,
  trailing,
  onSecret,
}: {
  title: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onSecret?: () => void;
}) {
  return (
    <View pointerEvents="box-none" style={p.header}>
      <View style={p.side}>{leading}</View>
      <Pressable
        accessibilityRole="header"
        onLongPress={onSecret}
        delayLongPress={900}
        style={p.titleWrap}
      >
        <Text numberOfLines={1} style={p.title}>
          {title}
        </Text>
      </Pressable>
      <View style={[p.side, { alignItems: 'flex-end' }]}>{trailing}</View>
    </View>
  );
}
export function FloatingTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[p.tabs, { bottom: Math.max(12, insets.bottom - 9) }]}>
      <Glass style={p.tabGroup}>
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;
          const color = selected ? C.blue : C.control;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              style={[p.tab, selected && p.selected]}
            >
              {route.name === 'contacts' || route.name === 'calls' ? (
                <KitIcon name={route.name} color={color} />
              ) : (
                <Icon
                  name={route.name === 'index' ? 'chatbubbles' : 'settings-outline'}
                  size={28}
                  color={color}
                />
              )}
              <Text
                numberOfLines={1}
                style={[p.tabLabel, { color, fontWeight: selected ? '700' : '500' }]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </Glass>
      <GlassButton
        icon="search"
        label="Поиск чатов"
        size={62}
        onPress={() => router.navigate({ pathname: '/', params: { search: '1' } })}
      />
    </View>
  );
}
export const p = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 54,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    zIndex: 5,
  },
  side: { width: 100, flexDirection: 'row' },
  titleWrap: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.body, fontFamily: systemFont, fontWeight: '600', color: '#333333' },
  tabs: {
    position: 'absolute',
    left: 25,
    right: 25,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tabGroup: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 3,
    minHeight: 62,
  },
  tab: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    gap: 1,
  },
  selected: { backgroundColor: C.selection },
  tabLabel: { fontSize: 10, lineHeight: 12, fontFamily: systemFont },
});
