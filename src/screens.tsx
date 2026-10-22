import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar, C, Empty, Header, Icon } from './ui';
import {
  messagesFor,
  nameOf,
  sortedChats,
  type Chat,
  type Document,
  type Message,
  type Profile,
} from './model';

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('ru-RU');
function listTime(iso: string) {
  const d = new Date(iso);
  return dayKey(iso) === dayKey(new Date().toISOString())
    ? timeLabel(iso)
    : d.toLocaleDateString('ru-RU', { day: 'numeric', month: '2-digit' });
}
function Checks({ message, color = '#65A752' }: { message: Message; color?: string }) {
  return (
    <Text
      accessibilityLabel={message.receipt === 'read' ? 'Прочитано' : 'Отправлено'}
      style={{ fontSize: 15, color, letterSpacing: -3, paddingRight: 3 }}
    >
      {message.receipt === 'read' ? '✓✓' : '✓'}
    </Text>
  );
}
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
export function ChatsScreen({
  data,
  openChat,
  openEditor,
}: {
  data: Document;
  openChat: (id: string) => void;
  openEditor: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const chats = sortedChats(data).filter((c) => {
    const p = data.profiles.find((p) => p.id === c.profileId)!;
    return (
      (filter === 'all' || c.unread > 0) &&
      nameOf(p).toLocaleLowerCase().includes(query.toLocaleLowerCase().trim())
    );
  });
  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Header title="Чаты" onSecret={openEditor} />
      <View style={st.searchWrap}>
        <View style={st.search}>
          <Icon name="search" color={C.muted} size={18} />
          <TextInput
            accessibilityLabel="Поиск чатов"
            placeholder="Поиск"
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
            style={st.searchInput}
          />
          {query.length > 0 && (
            <Pressable accessibilityLabel="Очистить поиск" onPress={() => setQuery('')}>
              <Icon name="close-circle" size={18} color={C.muted} />
            </Pressable>
          )}
        </View>
      </View>
      <View style={st.filters}>
        {(
          [
            { value: 'all', label: 'Все чаты' },
            { value: 'unread', label: 'Непрочитанные' },
          ] as const
        ).map((f) => (
          <Pressable
            key={f.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === f.value }}
            onPress={() => setFilter(f.value)}
            style={[st.filter, filter === f.value && st.activeFilter]}
          >
            <Text
              style={{
                color: filter === f.value ? C.blue : C.muted,
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Empty
            title={
              query
                ? 'Ничего не найдено'
                : filter === 'unread'
                  ? 'Нет непрочитанных'
                  : 'Здесь будут ваши чаты'
            }
            description={
              query
                ? 'Попробуйте другое имя.'
                : filter === 'unread'
                  ? 'Все сообщения прочитаны.'
                  : 'Добавьте собеседника и переписку в редакторе.'
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
              style={({ pressed }) => [st.chatRow, pressed && { backgroundColor: '#F2F2F7' }]}
            >
              <Avatar profile={profile} size={58} />
              <View style={st.chatBody}>
                <View style={st.chatTitleRow}>
                  <Text style={st.chatName} numberOfLines={1}>
                    {nameOf(profile)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {last?.direction === 'outgoing' && <Checks message={last} color={C.blue} />}
                    <Text style={st.chatTime}>{last ? listTime(last.sentAt) : ''}</Text>
                  </View>
                </View>
                <View style={st.chatPreviewRow}>
                  <Text
                    numberOfLines={2}
                    style={[st.preview, chat.presence === 'typing' && { color: C.blue }]}
                  >
                    {chat.presence === 'typing' ? 'печатает…' : last?.text || 'Нет сообщений'}
                  </Text>
                  {chat.unread > 0 && (
                    <View style={st.badge}>
                      <Text style={st.badgeText}>{chat.unread > 999 ? '999+' : chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
export function DialogueScreen({
  data,
  chat,
  back,
  openProfile,
  openEditor,
  send,
}: {
  data: Document;
  chat: Chat;
  back: () => void;
  openProfile: () => void;
  openEditor: () => void;
  send: (text: string) => void;
}) {
  const profile = data.profiles.find((p) => p.id === chat.profileId)!;
  const messages = messagesFor(data, chat.id);
  const [text, setText] = useState('');
  const list = useRef<FlatList<Message>>(null);
  const [atBottom, setAtBottom] = useState(true);
  const previousLastId = useRef<string | undefined>(undefined);
  const lastMessageId = messages.at(-1)?.id;
  const messageCount = messages.length;
  useEffect(() => {
    if (atBottom || previousLastId.current !== lastMessageId)
      requestAnimationFrame(() => list.current?.scrollToEnd({ animated: false }));
    previousLastId.current = lastMessageId;
  }, [messageCount, lastMessageId, atBottom]);
  const submit = () => {
    if (text.trim()) {
      send(text);
      setText('');
      setAtBottom(true);
    }
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={st.dialogueHeader}>
        <Pressable accessibilityLabel="Назад к чатам" onPress={back} style={st.back}>
          <Icon name="chevron-back" size={28} />
          <Text style={{ color: C.blue, fontSize: 16 }}>Чаты</Text>
        </Pressable>
        <Pressable
          onPress={openProfile}
          onLongPress={openEditor}
          delayLongPress={900}
          style={st.peerTitle}
        >
          <Text numberOfLines={1} style={st.peerName}>
            {nameOf(profile)}
          </Text>
          <PresenceLabel presence={chat.presence} />
        </Pressable>
        <Pressable
          accessibilityLabel="Открыть профиль"
          onPress={openProfile}
          style={{ padding: 7 }}
        >
          <Avatar profile={profile} size={36} />
        </Pressable>
      </View>
      <View style={st.wallpaper}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={st.messages}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScroll={(e) => {
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
            setAtBottom(layoutMeasurement.height + contentOffset.y >= contentSize.height - 70);
          }}
          scrollEventThrottle={100}
          onContentSizeChange={() => {
            if (atBottom) list.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <View style={st.startNotice}>
              <Text style={{ color: '#657463', textAlign: 'center', fontSize: 14 }}>
                Сообщений пока нет
              </Text>
            </View>
          }
          renderItem={({ item: m, index }) => {
            const showDate = index === 0 || dayKey(messages[index - 1].sentAt) !== dayKey(m.sentAt);
            const outgoing = m.direction === 'outgoing';
            return (
              <View>
                {showDate && (
                  <View style={st.dateWrap}>
                    <Text style={st.date}>
                      {new Date(m.sentAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year:
                          new Date(m.sentAt).getFullYear() === new Date().getFullYear()
                            ? undefined
                            : 'numeric',
                      })}
                    </Text>
                  </View>
                )}
                <View style={[st.bubble, outgoing ? st.outgoing : st.incoming]}>
                  <Text selectable style={st.messageText}>
                    {m.text}
                  </Text>
                  <View style={st.metadata}>
                    {m.edited && <Text style={st.metaText}>изменено</Text>}
                    <Text style={st.metaText}>{timeLabel(m.sentAt)}</Text>
                    {outgoing && <Checks message={m} />}
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
      <View style={st.composer}>
        <View style={st.composerField}>
          <TextInput
            accessibilityLabel="Сообщение"
            multiline
            numberOfLines={1}
            placeholder="Сообщение"
            placeholderTextColor={C.muted}
            value={text}
            onChangeText={setText}
            style={st.composerInput}
          />
        </View>
        <Pressable
          disabled={!text.trim()}
          accessibilityLabel="Отправить сообщение"
          onPress={submit}
          style={[st.send, !text.trim() && { opacity: 0.35 }]}
        >
          <Icon name="arrow-up" size={24} color="white" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
export function ProfileScreen({
  profile,
  presence,
  back,
  message,
  openEditor,
}: {
  profile: Profile;
  presence?: Chat['presence'];
  back: () => void;
  message?: () => void;
  openEditor: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.group }}>
      <Header title="Профиль" back={back} onSecret={openEditor} />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={st.profileHero}>
          <Avatar profile={profile} size={104} />
          <Text style={st.profileName}>{nameOf(profile)}</Text>
          {presence && <PresenceLabel presence={presence} />}
          {message && (
            <Pressable accessibilityRole="button" onPress={message} style={st.profileAction}>
              <Icon name="chatbubble" size={23} />
              <Text style={{ color: C.blue, fontSize: 13 }}>сообщение</Text>
            </Pressable>
          )}
        </View>
        <View style={st.profileCard}>
          {[
            { label: 'мобильный', value: profile.phone },
            {
              label: 'имя пользователя',
              value: profile.username ? `@${profile.username.replace(/^@/, '')}` : '',
            },
            { label: 'о себе', value: profile.bio },
          ].map((row, i) => (
            <View key={row.label} style={[st.profileInfo, i > 0 && st.infoBorder]}>
              <Text style={st.infoLabel}>{row.label}</Text>
              <Text selectable style={[st.infoValue, i < 2 && { color: C.blue }]}>
                {row.value || 'Не указано'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
const st = StyleSheet.create({
  online: { color: C.blue, fontSize: 13 },
  offline: { color: C.muted, fontSize: 13 },
  searchWrap: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 9,
    backgroundColor: C.surface,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    backgroundColor: '#E6E6EB',
    borderRadius: 10,
    height: 36,
  },
  searchInput: { flex: 1, fontSize: 17, color: C.text, paddingVertical: 0 },
  filters: {
    flexDirection: 'row',
    gap: 22,
    paddingHorizontal: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  filter: { paddingTop: 11, paddingBottom: 10 },
  activeFilter: { borderBottomWidth: 3, borderBottomColor: C.blue },
  chatRow: { flexDirection: 'row', paddingLeft: 12, gap: 11, alignItems: 'center' },
  chatBody: {
    flex: 1,
    minHeight: 79,
    paddingVertical: 10,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  chatTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'center',
  },
  chatName: { flex: 1, fontWeight: '600', fontSize: 17, color: C.text },
  chatTime: { color: C.muted, fontSize: 13 },
  chatPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
    minHeight: 35,
  },
  preview: { flex: 1, color: C.muted, fontSize: 15, lineHeight: 19 },
  badge: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 6,
    backgroundColor: C.blue,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  badgeText: { color: 'white', fontSize: 13, fontWeight: '500' },
  dialogueHeader: {
    height: 52,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  back: { flexDirection: 'row', alignItems: 'center', minWidth: 82 },
  peerTitle: { flex: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  peerName: {
    fontSize: 17,
    fontWeight: '600',
    maxWidth: '100%',
    paddingHorizontal: 5,
    color: C.text,
  },
  wallpaper: { flex: 1, backgroundColor: C.wallpaper },
  messages: { paddingHorizontal: 9, paddingBottom: 12, paddingTop: 5, flexGrow: 1 },
  dateWrap: { alignItems: 'center', marginVertical: 12 },
  date: {
    color: 'white',
    backgroundColor: '#8B9B86',
    overflow: 'hidden',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  bubble: {
    maxWidth: '84%',
    minWidth: 74,
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingTop: 7,
    paddingBottom: 5,
    marginVertical: 2,
    boxShadow: '0px 1px 1px #00000012',
  },
  outgoing: { alignSelf: 'flex-end', backgroundColor: C.outgoing, borderBottomRightRadius: 5 },
  incoming: { alignSelf: 'flex-start', backgroundColor: C.incoming, borderBottomLeftRadius: 5 },
  messageText: { fontSize: 17, lineHeight: 22, color: C.text },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 1,
  },
  metaText: { fontSize: 11, color: '#759269' },
  startNotice: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFFB3',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  composer: {
    backgroundColor: C.surface,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D3D7CE',
  },
  composerField: {
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C7C7CC',
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  composerInput: {
    fontSize: 17,
    lineHeight: 21,
    minHeight: 21,
    maxHeight: 130,
    padding: 0,
    color: C.text,
  },
  send: {
    width: 34,
    height: 34,
    borderRadius: 18,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  profileHero: { alignItems: 'center', paddingTop: 25, paddingBottom: 23, gap: 9 },
  profileName: {
    fontSize: 27,
    fontWeight: '600',
    color: C.text,
    marginTop: 3,
    textAlign: 'center',
  },
  profileAction: {
    backgroundColor: 'white',
    borderRadius: 11,
    alignItems: 'center',
    paddingVertical: 10,
    width: 105,
    gap: 4,
    marginTop: 9,
  },
  profileCard: {
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 11,
    paddingLeft: 16,
  },
  profileInfo: { paddingVertical: 12, paddingRight: 16, gap: 5 },
  infoBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  infoLabel: { fontSize: 13, color: C.text },
  infoValue: { fontSize: 17, lineHeight: 23 },
});
