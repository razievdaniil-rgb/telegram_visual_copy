import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glass, GlassButton } from './glass';
import { SystemSymbol } from './kit-symbol';
import { TelegramIcon } from './telegram-assets';
import { useChatSearch } from './chat-search';
import { colors as C, systemFont, type } from './theme';
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
  const { query, setQuery } = useChatSearch();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const params = state.routes[state.index].params as { search?: string } | undefined;
  const searching = state.routes[state.index].name === 'index' && params?.search === '1';
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const side = insets.bottom > 28 ? 12 : 20;
  return (
    <View
      pointerEvents="box-none"
      style={[
        p.tabs,
        {
          left: side,
          right: side,
          bottom: searching && keyboardHeight ? keyboardHeight + 8 : Math.max(8, insets.bottom),
        },
      ]}
    >
      {searching ? (
        <>
          <Glass style={p.search}>
            <SystemSymbol name="search" color={C.muted} size={20} />
            <TextInput
              autoFocus
              accessibilityLabel="Поиск чатов"
              placeholder="Поиск"
              placeholderTextColor={C.muted}
              value={query}
              onChangeText={setQuery}
              style={p.searchInput}
            />
            {!!query && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Очистить поиск"
                onPress={() => setQuery('')}
                style={p.clear}
              >
                <SystemSymbol name="close" color={C.muted} size={16} />
              </Pressable>
            )}
          </Glass>
          <GlassButton
            icon="close"
            label="Закрыть поиск"
            size={48}
            onPress={() => {
              setQuery('');
              Keyboard.dismiss();
              router.setParams({ search: undefined });
            }}
          />
        </>
      ) : (
        <>
          <Glass style={p.tabGroup}>
            <View
              pointerEvents="none"
              style={[
                p.selected,
                {
                  left: `${(state.index / state.routes.length) * 100}%`,
                  width: `${100 / state.routes.length}%`,
                },
              ]}
            />
            {state.routes.map((route, index) => {
              const selected = state.index === index;
              const label = descriptors[route.key].options.title ?? route.name;
              const color = selected ? C.blue : C.control;
              const icon =
                route.name === 'index'
                  ? 'chats'
                  : route.name === 'contacts'
                    ? 'contacts'
                    : route.name === 'calls'
                      ? 'calls'
                      : 'settings';
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
                  style={p.tab}
                >
                  <View style={p.tabIcon}>
                    <TelegramIcon name={icon} color={color} />
                  </View>
                  <Text numberOfLines={1} style={[p.tabLabel, { color }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </Glass>
          <GlassButton
            icon="search"
            label="Поиск чатов"
            size={64}
            onPress={() => router.navigate({ pathname: '/', params: { search: '1' } })}
          />
        </>
      )}
    </View>
  );
}
export const p = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    zIndex: 5,
  },
  side: { width: 100, flexDirection: 'row' },
  titleWrap: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.body, fontFamily: systemFont, fontWeight: '600', color: C.text },
  tabs: {
    position: 'absolute',
    maxWidth: 500,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tabGroup: { flex: 1, flexDirection: 'row', padding: 4, height: 64 },
  tab: { flex: 1, height: 56, alignItems: 'center' },
  tabIcon: { position: 'absolute', top: -4 },
  selected: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 100,
    backgroundColor: C.selection,
  },
  tabLabel: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: systemFont,
    fontWeight: '600',
  },
  search: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    gap: 4,
    paddingRight: 8,
  },
  searchInput: {
    ...type.body,
    fontFamily: systemFont,
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: C.text,
  },
  clear: { height: 40, width: 28, alignItems: 'center', justifyContent: 'center' },
});
