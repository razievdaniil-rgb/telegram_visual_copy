import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from './text';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Empty } from './ui';
import { GlassButton, GlassContent } from './glass';
import { ActionMenu } from './action-menu';
import { usePreferences } from './preferences';
import { searchChats, searchMessages, toggleId, visibleChats } from './preferences-model';
import { useStore } from './store';
import { goBack } from './navigation';
import { PublicHeader } from './public-ui';
import { colors as C, layout, systemFont, type } from './theme';
import { messagesFor, nameOf, type Document } from './model';
import { MessageChecks, listTime } from './message-ui';
import { useChatSearch } from './chat-search';
export function ChatsScreen({
  data,
  openChat,
  openEditor,
  archive = false,
}: {
  data: Document;
  openChat: (id: string) => void;
  openEditor: () => void;
  archive?: boolean;
}) {
  const { search } = useLocalSearchParams<{ search?: string }>();
  const searching = search === '1';
  const { query } = useChatSearch();
  const { preferences, change } = usePreferences();
  const { dispatch } = useStore();
  const [folder, setFolder] = useState('all');
  const [menu, setMenu] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const insets = useSafeAreaInsets();
  const chats = searching
    ? searchChats(data, query)
    : visibleChats(data, preferences, archive ? 'archive' : folder);
  const results = searching ? searchMessages(data, query) : [];
  const selected = data.chats.find((c) => c.id === menu);
  return (
    <View style={s.screen}>
      <GlassContent>
        <FlatList
          data={chats}
          keyExtractor={(chat) => chat.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: searching ? 12 : 64,
            paddingBottom: 88 + insets.bottom,
          }}
          ListHeaderComponent={
            <>
              {!searching && !archive && preferences.folders.length > 0 && (
                <ScrollView
                  horizontal
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    gap: 24,
                    minHeight: 44,
                    alignItems: 'center',
                  }}
                >
                  {[{ id: 'all', title: 'Все чаты' }, ...preferences.folders].map((f) => (
                    <Pressable
                      accessibilityRole="tab"
                      accessibilityState={{ selected: folder === f.id }}
                      key={f.id}
                      onPress={() => setFolder(f.id)}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          paddingVertical: 10,
                          color: folder === f.id ? C.blue : C.muted,
                          borderBottomWidth: folder === f.id ? 3 : 0,
                          borderColor: C.blue,
                        }}
                      >
                        {f.title}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {!searching &&
                !archive &&
                preferences.archived.some((id) => data.chats.some((c) => c.id === id)) && (
                  <Pressable
                    accessibilityRole="button"
                    style={{ padding: 16, backgroundColor: C.surface }}
                    onPress={() => router.push('/archive')}
                  >
                    <Text style={{ fontSize: 17, color: C.blue }}>Архив</Text>
                  </Pressable>
                )}
            </>
          }
          ListFooterComponent={
            results.length > 0 ? (
              <View>
                <Text style={{ padding: 16, color: C.muted, fontSize: 13 }}>СООБЩЕНИЯ</Text>
                {results.slice(0, 100).map((message) => {
                  const chat = data.chats.find((c) => c.id === message.chatId)!;
                  const profile = data.profiles.find((p) => p.id === chat.profileId)!;
                  return (
                    <Pressable
                      key={message.id}
                      accessibilityRole="button"
                      style={{
                        padding: 16,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderColor: C.line,
                      }}
                      onPress={() =>
                        router.push({
                          pathname: '/chat/[id]',
                          params: { id: chat.id, messageId: message.id },
                        })
                      }
                    >
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>{nameOf(profile)}</Text>
                      <Text
                        numberOfLines={3}
                        style={{ fontSize: 15, color: C.muted, marginTop: 4 }}
                      >
                        {message.text}
                      </Text>
                    </Pressable>
                  );
                })}
                {results.length > 100 && (
                  <Text style={{ padding: 16, color: C.muted }}>
                    Показаны первые 100 совпадений. Уточните запрос.
                  </Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            results.length ? null : (
              <Empty
                title={
                  query && searching ? 'Ничего не найдено' : archive ? 'Архив пуст' : 'Нет чатов'
                }
                description={
                  query && searching ? 'Попробуйте другое имя' : 'Ваши переписки появятся здесь'
                }
              />
            )
          }
          renderItem={({ item: chat }) => {
            const profile = data.profiles.find((p) => p.id === chat.profileId)!;
            const last = messagesFor(data, chat.id).at(-1);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Чат ${nameOf(profile)}`}
                onPress={() => (editing ? setMenu(chat.id) : openChat(chat.id))}
                onLongPress={() => setMenu(chat.id)}
                style={({ pressed }) => [s.row, pressed && s.pressed]}
              >
                <Avatar profile={profile} size={layout.avatar} />
                <View style={s.rowBody}>
                  <View style={s.titleRow}>
                    <Text numberOfLines={1} style={s.name}>
                      {nameOf(profile)}
                    </Text>
                    {last?.direction === 'outgoing' && (
                      <MessageChecks receipt={last.receipt} color={C.listCheck} />
                    )}
                    <Text style={s.time}>{last ? listTime(last.sentAt) : ''}</Text>
                    {preferences.pinned.includes(chat.id) && (
                      <Text style={{ color: C.muted, fontSize: 12 }}>●</Text>
                    )}
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
                <View style={s.separator} />
              </Pressable>
            );
          }}
        />
      </GlassContent>
      {!searching && (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={['#FFFFFF', '#FFFFFFF5', '#FFFFFF00']}
            locations={[0, 0.75, 1]}
            style={s.topFade}
          />
          <PublicHeader
            title={archive ? 'Архив' : 'Чаты'}
            onSecret={openEditor}
            leading={
              archive ? (
                <GlassButton icon="back" label="Назад" onPress={goBack} />
              ) : (
                <GlassButton
                  title={editing ? 'Готово' : 'Изм.'}
                  label="Изменить список чатов"
                  onPress={() => setEditing(!editing)}
                />
              )
            }
            trailing={
              <GlassButton
                telegramIcon="compose"
                label="Новый чат"
                onPress={() => router.push('/new-chat')}
              />
            }
          />
        </>
      )}
      {selected && (
        <ActionMenu
          title={nameOf(data.profiles.find((p) => p.id === selected.profileId)!)}
          close={() => setMenu(null)}
          items={[
            {
              title: preferences.archived.includes(selected.id) ? 'Вернуть из архива' : 'В архив',
              action: () => change((p) => ({ ...p, archived: toggleId(p.archived, selected.id) })),
            },
            {
              title: preferences.pinned.includes(selected.id) ? 'Открепить' : 'Закрепить',
              action: () => change((p) => ({ ...p, pinned: toggleId(p.pinned, selected.id) })),
            },
            { title: 'Папки чатов', action: () => router.push('/folders') },
            {
              title: 'Удалить чат',
              danger: true,
              action: () => dispatch({ type: 'chat/delete', id: selected.id }),
            },
          ]}
        />
      )}
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 72 },
  row: { height: layout.row, flexDirection: 'row', paddingLeft: 16, gap: 10, alignItems: 'center' },
  pressed: { backgroundColor: C.group },
  rowBody: {
    flex: 1,
    height: layout.row,
    paddingTop: 8 + StyleSheet.hairlineWidth,
    paddingRight: 16,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...type.chatTitle, fontFamily: systemFont, flex: 1, color: C.text },
  time: { fontFamily: systemFont, fontSize: 14, lineHeight: 19, color: C.muted },
  previewRow: { flexDirection: 'row', gap: 8, marginTop: -2, marginLeft: -1 },
  preview: { ...type.preview, fontFamily: systemFont, color: C.muted, flex: 1 },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
  },
  badgeText: {
    fontFamily: systemFont,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: 'white',
  },
  separator: {
    position: 'absolute',
    left: 84,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.line,
  },
});
