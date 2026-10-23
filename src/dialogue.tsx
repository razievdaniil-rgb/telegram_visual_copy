import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon } from './ui';
import { Glass, GlassButton, GlassContent, useUnavailable } from './glass';
import { Wallpaper } from './wallpaper';
import { colors as C, layout, systemFont, type } from './theme';
import { messagesFor, nameOf, type Chat, type Document, type Message } from './model';
import { dayKey, MessageChecks, timeLabel } from './message-ui';
import { kitAssets } from './kit-assets';
import { PresenceLabel } from './presence';

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
  const [inputHeight, setInputHeight] = useState(22);
  const [keyboard, setKeyboard] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const [width, setWidth] = useState(402);
  const list = useRef<FlatList<Message>>(null);
  const lastId = messages.at(-1)?.id;
  const previousLastId = useRef<string | undefined>(undefined);
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  useEffect(() => {
    if (atBottom || previousLastId.current !== lastId)
      requestAnimationFrame(() => list.current?.scrollToEnd({ animated: false }));
    previousLastId.current = lastId;
  }, [messages.length, lastId, atBottom]);
  const submit = () => {
    if (!text.trim()) return;
    send(text);
    setText('');
    setInputHeight(22);
    setAtBottom(true);
  };
  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'height' : undefined}
      keyboardVerticalOffset={insets.top}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <GlassContent>
        <Wallpaper />
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={[
            s.messages,
            { paddingBottom: Math.min(130, inputHeight) + 60 + (keyboard ? 0 : insets.bottom) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            setAtBottom(layoutMeasurement.height + contentOffset.y >= contentSize.height - 70);
          }}
          scrollEventThrottle={100}
          onContentSizeChange={() => {
            if (atBottom) list.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>Сообщений пока нет</Text>
            </View>
          }
          renderItem={({ item: m, index }) => {
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const showDate = !previous || dayKey(previous.sentAt) !== dayKey(m.sentAt);
            const sameNext =
              next &&
              next.direction === m.direction &&
              dayKey(next.sentAt) === dayKey(m.sentAt) &&
              new Date(next.sentAt).getTime() - new Date(m.sentAt).getTime() < 300_000;
            const outgoing = m.direction === 'outgoing';
            const metaColor = outgoing ? C.outgoingMeta : C.incomingMeta;
            const meta = `${m.edited ? 'изменено ' : ''}${timeLabel(m.sentAt)}`;
            return (
              <View>
                {showDate && (
                  <View style={s.dateWrap}>
                    <Glass capture={false} style={s.dateGlass}>
                      <Text style={s.date}>
                        {new Date(m.sentAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year:
                            new Date(m.sentAt).getFullYear() === new Date().getFullYear()
                              ? undefined
                              : 'numeric',
                        })}
                      </Text>
                    </Glass>
                  </View>
                )}
                <View
                  style={[
                    s.bubble,
                    { maxWidth: Math.min(288, width - 48) },
                    outgoing ? s.outgoing : s.incoming,
                    sameNext &&
                      (outgoing ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }),
                    { marginBottom: sameNext ? 2 : 6 },
                  ]}
                >
                  {!sameNext && (
                    <Image
                      source={outgoing ? kitAssets.outgoingTail : kitAssets.incomingTail}
                      contentFit="contain"
                      style={[s.tail, outgoing ? s.outgoingTail : s.incomingTail]}
                    />
                  )}
                  <Text selectable style={s.messageText}>
                    {m.text}
                    <Text
                      aria-hidden
                      accessibilityElementsHidden
                      importantForAccessibility="no"
                      style={s.reservedTime}
                    >
                      {`  ${meta}${outgoing ? '     ' : ''}`}
                    </Text>
                  </Text>
                  <View style={s.metadata} pointerEvents="none">
                    <Text style={[s.metaText, { color: metaColor }]}>{meta}</Text>
                    {outgoing && <MessageChecks receipt={m.receipt} color={metaColor} />}
                  </View>
                </View>
              </View>
            );
          }}
        />
      </GlassContent>
      <View pointerEvents="box-none" style={s.header}>
        <GlassButton icon="back" label="Назад к чатам" onPress={back} />
        <Glass style={s.peerGlass}>
          <Pressable
            accessibilityLabel="Открыть профиль"
            onPress={openProfile}
            onLongPress={openEditor}
            delayLongPress={900}
            style={s.peer}
          >
            <Text numberOfLines={1} style={s.peerName}>
              {nameOf(profile)}
            </Text>
            <PresenceLabel presence={chat.presence} />
          </Pressable>
        </Glass>
        <Glass style={s.avatarGlass}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Аватар собеседника"
            onPress={openProfile}
          >
            <Avatar profile={profile} size={38} />
          </Pressable>
        </Glass>
      </View>
      <View style={[s.composer, { paddingBottom: keyboard ? 6 : Math.max(10, insets.bottom - 6) }]}>
        <Glass style={s.round}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Вложения"
            onPress={unavailable}
            style={s.roundPress}
          >
            <Icon name="attach" size={28} color={C.control} />
          </Pressable>
        </Glass>
        <Glass style={s.field}>
          <TextInput
            accessibilityLabel="Сообщение"
            placeholder="Сообщение"
            placeholderTextColor="#999999"
            multiline
            value={text}
            onChangeText={setText}
            onContentSizeChange={(event) =>
              setInputHeight(Math.max(22, Math.min(130, event.nativeEvent.contentSize.height)))
            }
            scrollEnabled={inputHeight >= 130}
            style={[s.input, { height: inputHeight }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Стикеры и emoji"
            onPress={unavailable}
            style={s.emoji}
          >
            <Icon name="happy-outline" size={23} color="#727272" />
          </Pressable>
        </Glass>
        {text.trim() ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Отправить сообщение"
            onPress={submit}
            style={s.send}
          >
            <Icon name="arrow-up" size={28} color="white" />
          </Pressable>
        ) : (
          <GlassButton
            fallbackIcon="mic-outline"
            label="Голосовое сообщение"
            onPress={unavailable}
            size={42}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.wallpaper },
  header: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  peerGlass: { maxWidth: '68%', minWidth: 90 },
  peer: { height: 44, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  peerName: {
    ...type.preview,
    fontFamily: systemFont,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 18,
  },
  avatarGlass: {
    width: 44,
    height: 44,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 8, paddingTop: 62 },
  bubble: {
    maxWidth: 288,
    minWidth: 64,
    borderRadius: layout.bubble,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  outgoing: { alignSelf: 'flex-end', backgroundColor: C.outgoing, marginLeft: 24 },
  incoming: { alignSelf: 'flex-start', backgroundColor: C.incoming, marginRight: 24 },
  tail: { position: 'absolute', width: 13.6211, height: 32, bottom: 0.07 },
  incomingTail: { left: -5.6211 },
  outgoingTail: { right: -5.6211, transform: [{ scaleX: -1 }] },
  messageText: { ...type.body, fontFamily: systemFont, color: C.text },
  reservedTime: { fontSize: 11, letterSpacing: 0, color: 'transparent' },
  metadata: {
    position: 'absolute',
    bottom: 4,
    right: 9,
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  metaText: { fontFamily: systemFont, fontSize: 11, lineHeight: 12 },
  dateWrap: { alignItems: 'center', marginVertical: 10 },
  dateGlass: { boxShadow: 'none', backgroundColor: '#FFFFFF25' },
  date: {
    ...type.footnote,
    fontFamily: systemFont,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 3,
    color: '#6B562E',
  },
  empty: {
    alignSelf: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF80',
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyText: { ...type.preview, color: '#6B562E' },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 28,
    paddingTop: 4,
    gap: 6,
  },
  round: { width: 42, height: 42 },
  roundPress: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  field: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 9,
    paddingVertical: 9,
  },
  input: {
    ...type.body,
    fontFamily: systemFont,
    color: C.text,
    padding: 0,
    flex: 1,
    minWidth: 0,
    minHeight: 22,
    maxHeight: 130,
  },
  emoji: {
    width: 36,
    height: 36,
    marginVertical: -7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
