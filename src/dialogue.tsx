import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './ui';
import { Glass, GlassButton, GlassContent, useUnavailable } from './glass';
import { Wallpaper } from './wallpaper';
import { colors as C, systemFont, type } from './theme';
import { messagesFor, nameOf, type Chat, type Document, type Message } from './model';
import { dayKey } from './message-ui';
import { PresenceLabel } from './presence';
import { MessageContent } from './message-content';
import { maximumMessageWidth } from './message-geometry';
import { TextMeasure, type TextMetrics } from './text-measure';
import { TelegramIcon } from './telegram-assets';

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
  const [inputHeight, setInputHeight] = useState(21);
  const [inputWidth, setInputWidth] = useState(200);
  const measureInput = useCallback(
    (metrics: TextMetrics) => {
      setInputHeight(Math.max(21, Math.min(130, Math.ceil(metrics.height))));
    },
    [setInputHeight],
  );
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
    setInputHeight(21);
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
            {
              paddingBottom:
                Math.max(40, inputHeight + 19) + (keyboard ? 0 : Math.max(8, insets.bottom)) + 8,
            },
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
              new Date(next.sentAt).getTime() - new Date(m.sentAt).getTime() < 600_000;
            const samePrevious =
              previous &&
              previous.direction === m.direction &&
              dayKey(previous.sentAt) === dayKey(m.sentAt) &&
              new Date(m.sentAt).getTime() - new Date(previous.sentAt).getTime() < 600_000;
            return (
              <View>
                {showDate && (
                  <View style={s.dateWrap}>
                    <View style={s.dateGlass}>
                      <BlurView
                        pointerEvents="none"
                        intensity={75}
                        tint="default"
                        blurMethod="none"
                        style={StyleSheet.absoluteFill}
                      />
                      <View pointerEvents="none" style={s.dateTint} />
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
                    </View>
                  </View>
                )}
                <MessageContent
                  message={m}
                  previous={!!samePrevious}
                  next={!!sameNext}
                  maxWidth={maximumMessageWidth(width)}
                />
              </View>
            );
          }}
        />
      </GlassContent>
      <TextMeasure
        text={text.endsWith('\n') ? `${text}\u200b` : text || ' '}
        width={inputWidth}
        style={s.inputMeasure}
        onMeasure={measureInput}
      />
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
            <Avatar profile={profile} size={40} />
          </Pressable>
        </Glass>
      </View>
      <View
        style={[
          s.composer,
          {
            paddingBottom: keyboard ? 0 : Math.max(8, insets.bottom),
            paddingHorizontal: keyboard || insets.bottom <= 32 ? 26 : 8,
          },
        ]}
      >
        <Glass style={s.round}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Вложения"
            onPress={unavailable}
            style={s.roundPress}
          >
            <TelegramIcon name="attachment" />
          </Pressable>
        </Glass>
        <Glass style={s.field}>
          <TextInput
            testID="message-input"
            accessibilityLabel="Сообщение"
            placeholder="Сообщение"
            placeholderTextColor="#999999"
            multiline
            value={text}
            onChangeText={setText}
            onLayout={({ nativeEvent: { layout } }) => setInputWidth(layout.width)}
            scrollEnabled={inputHeight >= 130}
            style={[s.input, { height: inputHeight }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Стикеры и emoji"
            onPress={unavailable}
            style={s.emoji}
          >
            <TelegramIcon name="sticker" color="#8E8E93" />
          </Pressable>
          {text.trim() ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Отправить сообщение"
              onPress={submit}
              style={s.send}
            >
              <TelegramIcon name="send" color="white" />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Голосовое сообщение"
              onPress={unavailable}
              style={s.microphone}
            >
              <TelegramIcon name="microphone" />
            </Pressable>
          )}
        </Glass>
      </View>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.wallpaper },
  header: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  peerGlass: { maxWidth: '68%', minWidth: 90, flexShrink: 1 },
  peer: { height: 44, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  peerName: {
    ...type.body,
    fontFamily: systemFont,
    fontWeight: '600',
    color: C.text,
    lineHeight: 20,
  },
  avatarGlass: {
    width: 44,
    height: 44,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 3, paddingTop: 72 },
  dateWrap: { alignItems: 'center', height: 34, justifyContent: 'center' },
  dateGlass: { borderRadius: 100, overflow: 'hidden' },
  dateTint: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#00000033',
  },
  date: {
    ...type.footnote,
    fontFamily: systemFont,
    fontWeight: '600',
    paddingHorizontal: 7,
    paddingVertical: 3,
    color: 'white',
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
  round: { width: 40, height: 40 },
  roundPress: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  field: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 12,
    paddingRight: 3,
    paddingVertical: 9.5,
  },
  input: {
    position: 'relative',
    zIndex: 1,
    outlineWidth: 0,
    outlineStyle: 'solid',
    ...type.body,
    fontFamily: systemFont,
    color: C.text,
    padding: 0,
    flex: 1,
    minWidth: 0,
    minHeight: 21,
    maxHeight: 130,
  },
  inputMeasure: { ...type.body, fontFamily: systemFont, includeFontPadding: false },
  emoji: {
    width: 30,
    height: 40,
    marginVertical: -9.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  send: {
    width: 34,
    height: 34,
    marginVertical: -6.5,
    borderRadius: 17,
    backgroundColor: C.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  microphone: {
    width: 34,
    height: 40,
    marginVertical: -9.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
