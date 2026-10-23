import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Empty } from './ui';
import { Glass, GlassButton, GlassContent, useUnavailable } from './glass';
import { KitSymbol, SystemSymbol } from './kit-symbol';
import { PublicHeader } from './public-ui';
import { colors as C, layout, systemFont, type } from './theme';
import { messagesFor, nameOf, sortedChats, type Document } from './model';
import { MessageChecks, listTime } from './message-ui';

export function ChatsScreen({
  data,
  openChat,
  openEditor,
}: {
  data: Document;
  openChat: (id: string) => void;
  openEditor: () => void;
}) {
  const { search } = useLocalSearchParams<{ search?: string }>();
  const searching = search === '1';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  const chats = sortedChats(data).filter((chat) => {
    const profile = data.profiles.find((p) => p.id === chat.profileId)!;
    return (
      (filter === 'all' || chat.unread > 0) &&
      nameOf(profile).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    );
  });
  return (
    <View style={s.screen}>
      <GlassContent>
        <FlatList
          data={chats}
          keyExtractor={(chat) => chat.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 103, paddingBottom: 103 + insets.bottom }}
          ListEmptyComponent={
            <Empty
              title={
                query
                  ? 'Ничего не найдено'
                  : filter === 'unread'
                    ? 'Нет непрочитанных'
                    : 'Нет чатов'
              }
              description={query ? 'Попробуйте другое имя' : 'Ваши переписки появятся здесь'}
            />
          }
          renderItem={({ item: chat }) => {
            const profile = data.profiles.find((p) => p.id === chat.profileId)!;
            const last = messagesFor(data, chat.id).at(-1);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Чат ${nameOf(profile)}`}
                onPress={() => openChat(chat.id)}
                style={({ pressed }) => [s.row, pressed && s.pressed]}
              >
                <Avatar profile={profile} size={layout.avatar} />
                <View style={s.rowBody}>
                  <View style={s.titleRow}>
                    <Text numberOfLines={1} style={s.name}>
                      {nameOf(profile)}
                    </Text>
                    {last?.direction === 'outgoing' && (
                      <MessageChecks receipt={last.receipt} color={C.blue} />
                    )}
                    <Text style={s.time}>{last ? listTime(last.sentAt) : ''}</Text>
                  </View>
                  <View style={s.previewRow}>
                    <Text
                      numberOfLines={2}
                      style={[s.preview, chat.presence === 'typing' && { color: C.blue }]}
                    >
                      {chat.presence === 'typing' ? 'печатает…' : last?.text || 'Нет сообщений'}
                    </Text>
                    {chat.unread > 0 && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{chat.unread > 999 ? '999+' : chat.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          }}
        />
      </GlassContent>
      <LinearGradient
        pointerEvents="none"
        colors={['#FFFFFF', '#FFFFFFF5', '#FFFFFF00']}
        locations={[0, 0.75, 1]}
        style={s.topFade}
      />
      <PublicHeader
        title="Чаты"
        onSecret={openEditor}
        leading={<GlassButton title="Изм." label="Изменить список чатов" onPress={unavailable} />}
        trailing={
          <Glass style={s.trailing}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Добавить историю"
              onPress={unavailable}
              style={s.headerButton}
            >
              <KitSymbol name="story" size={30} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Новый чат"
              onPress={unavailable}
              style={s.headerButton}
            >
              <KitSymbol name="compose" size={30} />
            </Pressable>
          </Glass>
        }
      />
      <View style={s.foldersWrap}>
        {searching ? (
          <Glass style={s.search}>
            <SystemSymbol name="search" color={C.muted} />
            <TextInput
              autoFocus
              accessibilityLabel="Поиск чатов"
              placeholder="Поиск"
              placeholderTextColor={C.muted}
              value={query}
              onChangeText={setQuery}
              style={s.searchInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Закрыть поиск"
              style={s.close}
              onPress={() => {
                setQuery('');
                router.setParams({ search: undefined });
              }}
            >
              <SystemSymbol name="close" color={C.muted} size={17} />
            </Pressable>
          </Glass>
        ) : (
          <Glass style={s.folders}>
            {(
              [
                { value: 'all', label: 'Все' },
                { value: 'unread', label: 'Непрочит.' },
                { value: 'groups', label: 'Группы' },
                { value: 'bots', label: 'Боты' },
              ] as const
            ).map((item) => (
              <Pressable
                key={item.value}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: item.value === filter }}
                onPress={() =>
                  item.value === 'all' || item.value === 'unread'
                    ? setFilter(item.value)
                    : unavailable()
                }
                style={[s.folder, item.value === filter && s.selectedFolder]}
              >
                <Text
                  numberOfLines={1}
                  style={[s.folderText, item.value === filter && { color: C.blue }]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Glass>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  trailing: { height: 44, flexDirection: 'row', paddingHorizontal: 4, width: 92 },
  headerButton: { width: 42, height: 44, alignItems: 'center', justifyContent: 'center' },
  foldersWrap: { position: 'absolute', top: 52, left: 16, right: 16 },
  folders: { flexDirection: 'row', padding: 3, height: 41 },
  folder: { flex: 1, borderRadius: 100, alignItems: 'center', justifyContent: 'center' },
  selectedFolder: { backgroundColor: C.selection },
  folderText: { ...type.preview, fontFamily: systemFont, fontWeight: '600', color: C.control },
  search: { flexDirection: 'row', alignItems: 'center', paddingLeft: 9, minHeight: 41 },
  searchInput: {
    ...type.body,
    fontFamily: systemFont,
    flex: 1,
    padding: 0,
    color: C.text,
    minWidth: 0,
  },
  close: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', paddingLeft: 10, gap: 10, alignItems: 'center' },
  pressed: { backgroundColor: C.group },
  rowBody: {
    flex: 1,
    minHeight: layout.row,
    paddingVertical: 8,
    paddingBottom: 8 - StyleSheet.hairlineWidth,
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...type.body, fontFamily: systemFont, flex: 1, fontWeight: '500', color: C.text },
  time: { fontFamily: systemFont, fontSize: 14, lineHeight: 20, color: C.muted },
  previewRow: { flexDirection: 'row', gap: 12, minHeight: 40 },
  preview: { ...type.preview, fontFamily: systemFont, color: C.muted, flex: 1 },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  badgeText: { ...type.footnote, fontFamily: systemFont, fontWeight: '600', color: 'white' },
});
