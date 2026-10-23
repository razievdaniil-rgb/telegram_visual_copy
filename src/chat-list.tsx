import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Empty } from './ui';
import { GlassButton, GlassContent, useUnavailable } from './glass';
import { PublicHeader } from './public-ui';
import { colors as C, layout, systemFont, type } from './theme';
import { messagesFor, nameOf, sortedChats, type Document } from './model';
import { MessageChecks, listTime } from './message-ui';
import { useChatSearch } from './chat-search';
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
  const { query } = useChatSearch();
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  const chats = sortedChats(data).filter((chat) => {
    const profile = data.profiles.find((p) => p.id === chat.profileId)!;
    return (
      !searching || nameOf(profile).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    );
  });
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
          ListEmptyComponent={
            <Empty
              title={query && searching ? 'Ничего не найдено' : 'Нет чатов'}
              description={
                query && searching ? 'Попробуйте другое имя' : 'Ваши переписки появятся здесь'
              }
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
                      <MessageChecks receipt={last.receipt} color={C.listCheck} />
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
            title="Чаты"
            onSecret={openEditor}
            leading={
              <GlassButton title="Изм." label="Изменить список чатов" onPress={unavailable} />
            }
            trailing={
              <GlassButton telegramIcon="compose" label="Новый чат" onPress={unavailable} />
            }
          />
        </>
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
