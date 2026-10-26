import React, { useState } from 'react';
import { BackupPanel } from './backup-panel';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from './text';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Avatar, Button, C, Field, Header, Icon, IconButton, panel, Segment } from './ui';
import {
  blankProfile,
  localParts,
  messagesFor,
  nameOf,
  parseLocal,
  uid,
  type Action,
  type Chat,
  type Direction,
  type Document,
  type Message,
  type Presence,
  type Profile,
  type Receipt,
} from './model';
import { timeLabel } from './screens';

type Route =
  | { page: 'home' }
  | { page: 'profile'; profile: Profile; self?: boolean }
  | { page: 'chat'; chat: Chat }
  | { page: 'new-chat' }
  | { page: 'message'; message: Message; isNew: boolean };
type Props = {
  data: Document;
  dispatch: React.Dispatch<Action>;
  close: () => void;
  currentChatId?: string;
  addExample: () => void;
};
const PRESENCES = [
  { value: 'online', label: 'В сети' },
  { value: 'recently', label: 'Был(а) недавно' },
  { value: 'typing', label: 'Печатает…' },
] as const;

export function Editor({ data, dispatch, close, currentChatId, addExample }: Props) {
  const currentChat = data.chats.find((c) => c.id === currentChatId);
  const [route, setRoute] = useState<Route>(
    currentChat ? { page: 'chat', chat: currentChat } : { page: 'home' },
  );
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<null | { title: string; action: () => void }>(null);
  const home = () => {
    setNotice('');
    setRoute({ page: 'home' });
  };
  const messageBack = (chatId: string) => {
    const chat = data.chats.find((c) => c.id === chatId);
    setRoute(chat ? { page: 'chat', chat } : { page: 'home' });
  };
  const saveProfile = (profile: Profile, self?: boolean) => {
    dispatch({ type: self ? 'self/save' : 'profile/save', profile });
    home();
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.group }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title={
          route.page === 'home'
            ? 'Редактор'
            : route.page === 'profile'
              ? 'Профиль'
              : route.page === 'message'
                ? 'Сообщение'
                : route.page === 'new-chat'
                  ? 'Новый чат'
                  : 'Переписка'
        }
        back={
          route.page === 'home'
            ? undefined
            : route.page === 'message'
              ? () => messageBack(route.message.chatId)
              : home
        }
        right={<IconButton name="close" label="Закрыть редактор" onPress={close} />}
      />
      {notice ? (
        <Text accessibilityRole="alert" style={ed.notice}>
          {notice}
        </Text>
      ) : null}
      {route.page === 'home' && (
        <ScrollView contentContainerStyle={panel} keyboardShouldPersistTaps="handled">
          <Text style={ed.hint}>
            Настройте переписки здесь. Закройте редактор, чтобы просматривать их без элементов
            управления.
          </Text>
          <BackupPanel />
          <Text style={ed.section}>МОЙ ПРОФИЛЬ</Text>
          <EditorRow
            title={nameOf(data.self)}
            subtitle="Ваши данные в настройках"
            profile={data.self}
            onPress={() => setRoute({ page: 'profile', profile: data.self, self: true })}
          />
          <View style={ed.sectionRow}>
            <Text style={ed.section}>СОБЕСЕДНИКИ</Text>
            <IconButton
              name="add"
              label="Добавить профиль"
              onPress={() => setRoute({ page: 'profile', profile: blankProfile() })}
            />
          </View>
          {data.profiles.map((p) => (
            <EditorRow
              key={p.id}
              title={nameOf(p)}
              subtitle={p.phone || 'Номер не указан'}
              profile={p}
              onPress={() => setRoute({ page: 'profile', profile: p })}
            />
          ))}
          {!data.profiles.length && (
            <Text style={ed.hint}>Добавьте профиль собеседника, затем создайте с ним чат.</Text>
          )}
          <Button
            title="Добавить собеседника"
            onPress={() => setRoute({ page: 'profile', profile: blankProfile() })}
          />
          <View style={ed.sectionRow}>
            <Text style={ed.section}>ЧАТЫ</Text>
          </View>
          {data.chats.map((c) => {
            const p = data.profiles.find((p) => p.id === c.profileId)!;
            return (
              <EditorRow
                key={c.id}
                title={nameOf(p)}
                subtitle={`${messagesFor(data, c.id).length} сообщ. · ${PRESENCES.find((s) => s.value === c.presence)?.label}`}
                profile={p}
                onPress={() => setRoute({ page: 'chat', chat: c })}
              />
            );
          })}
          <Button
            title="Создать чат"
            disabled={!data.profiles.length}
            onPress={() => setRoute({ page: 'new-chat' })}
          />
          {!data.profiles.length && !data.chats.length && (
            <Pressable onPress={addExample} style={ed.link}>
              <Text style={{ color: C.blue }}>Добавить пример для знакомства</Text>
            </Pressable>
          )}
          <Text style={ed.hint}>
            Редактор открывается долгим нажатием на заголовок «Чаты» или имя в шапке диалога. Данные
            хранятся только на этом устройстве.
          </Text>
        </ScrollView>
      )}
      {route.page === 'profile' && (
        <ProfileForm
          key={route.profile.id}
          initial={route.profile}
          save={(p) => saveProfile(p, route.self)}
        />
      )}
      {route.page === 'new-chat' && (
        <ScrollView contentContainerStyle={panel}>
          <Text style={ed.hint}>
            Выберите собеседника. С каждым профилем создаётся один личный чат.
          </Text>
          {data.profiles.map((p) => {
            const existing = data.chats.find((c) => c.profileId === p.id);
            return (
              <EditorRow
                key={p.id}
                title={nameOf(p)}
                subtitle={existing ? 'Открыть существующую переписку' : 'Создать переписку'}
                profile={p}
                onPress={() => {
                  const chat: Chat = existing || {
                    id: uid(),
                    profileId: p.id,
                    presence: 'recently',
                    unread: 0,
                    createdAt: new Date().toISOString(),
                  };
                  if (!existing) dispatch({ type: 'chat/save', chat });
                  setRoute({ page: 'chat', chat });
                }}
              />
            );
          })}
        </ScrollView>
      )}
      {route.page === 'chat' && (
        <ChatForm
          key={route.chat.id}
          data={data}
          chat={data.chats.find((c) => c.id === route.chat.id) || route.chat}
          save={(chat) => {
            dispatch({ type: 'chat/save', chat });
            setNotice('Настройки чата сохранены');
          }}
          editProfile={(p) => setRoute({ page: 'profile', profile: p })}
          editMessage={(m) => setRoute({ page: 'message', message: m, isNew: false })}
          addMessage={() =>
            setRoute({
              page: 'message',
              isNew: true,
              message: {
                id: uid(),
                chatId: route.chat.id,
                text: '',
                direction: 'incoming',
                sentAt: new Date().toISOString(),
                receipt: 'read',
                edited: false,
              },
            })
          }
          remove={() =>
            setConfirm({
              title: 'Удалить чат и все его сообщения?',
              action: () => {
                dispatch({ type: 'chat/delete', id: route.chat.id });
                home();
              },
            })
          }
        />
      )}
      {route.page === 'message' && (
        <MessageForm
          key={route.message.id}
          initial={route.message}
          isNew={route.isNew}
          save={(message) => {
            dispatch({ type: 'message/save', message });
            setNotice('Сообщение сохранено');
            messageBack(message.chatId);
          }}
          remove={() =>
            setConfirm({
              title: 'Удалить это сообщение?',
              action: () => {
                dispatch({ type: 'message/delete', id: route.message.id });
                messageBack(route.message.chatId);
              },
            })
          }
        />
      )}
      {confirm && (
        <View style={ed.confirmOverlay}>
          <View accessibilityViewIsModal style={ed.confirmCard}>
            <Text style={ed.confirmTitle}>{confirm.title}</Text>
            <Button
              danger
              title="Удалить"
              onPress={() => {
                confirm.action();
                setConfirm(null);
              }}
            />
            <Button title="Отмена" onPress={() => setConfirm(null)} />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
function EditorRow({
  title,
  subtitle,
  profile,
  onPress,
}: {
  title: string;
  subtitle: string;
  profile?: Profile;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={ed.row}>
      {profile && <Avatar profile={profile} size={42} />}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={ed.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={ed.rowSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Icon name="chevron-forward" size={18} color="#B5B5BB" />
    </Pressable>
  );
}
function ProfileForm({ initial, save }: { initial: Profile; save: (p: Profile) => void }) {
  const [profile, setProfile] = useState(initial);
  const [error, setError] = useState('');
  const set = (key: keyof Profile, value: string | null) =>
    setProfile((p) => ({ ...p, [key]: value }));
  const pick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.55,
      });
      if (!result.canceled) {
        const asset = result.assets[0];
        const context = ImageManipulator.manipulate(asset.uri);
        const edge = Math.min(asset.width, asset.height);
        context.crop({
          originX: (asset.width - edge) / 2,
          originY: (asset.height - edge) / 2,
          width: edge,
          height: edge,
        });
        context.resize({ width: 320, height: 320 });
        const image = await context.renderAsync();
        const thumbnail = await image.saveAsync({
          format: SaveFormat.JPEG,
          compress: 0.7,
          base64: true,
        });
        if (!thumbnail.base64) {
          setError('Не удалось прочитать изображение. Выберите другое.');
          return;
        }
        if (thumbnail.base64.length > 250_000) {
          setError('Изображение слишком большое. Обрежьте его или выберите другое.');
          return;
        }
        set('avatar', `data:image/jpeg;base64,${thumbnail.base64}`);
        setError('');
      }
    } catch {
      setError('Не удалось открыть галерею. Проверьте разрешение на доступ к фото.');
    }
  };
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={panel}>
      <View style={{ alignItems: 'center', marginTop: 22, gap: 12 }}>
        <Avatar profile={profile} size={88} />
        <Pressable accessibilityRole="button" onPress={pick}>
          <Text style={{ color: C.blue, fontSize: 16 }}>Выбрать аватар</Text>
        </Pressable>
        {profile.avatar && (
          <Pressable onPress={() => set('avatar', null)}>
            <Text style={{ color: C.red }}>Убрать фото</Text>
          </Pressable>
        )}
      </View>
      <Field
        label="Имя"
        value={profile.firstName}
        onChangeText={(v) => set('firstName', v)}
        autoCapitalize="words"
        maxLength={80}
      />
      <Field
        label="Фамилия"
        value={profile.lastName}
        onChangeText={(v) => set('lastName', v)}
        autoCapitalize="words"
        maxLength={80}
      />
      <Field
        label="Имя пользователя"
        value={profile.username}
        onChangeText={(v) => set('username', v.replace(/^@/, ''))}
        placeholder="username"
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={64}
      />
      <Field
        label="Номер телефона (произвольный)"
        value={profile.phone}
        onChangeText={(v) => set('phone', v)}
        placeholder="+7 900 000-00-00"
        keyboardType="phone-pad"
        maxLength={64}
      />
      <Field
        label="О себе"
        multiline
        value={profile.bio}
        onChangeText={(v) => set('bio', v)}
        maxLength={300}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ed.error}>
          {error}
        </Text>
      )}
      <Button
        title="Сохранить профиль"
        onPress={() => {
          if (!profile.firstName.trim()) {
            setError('Укажите имя собеседника.');
            return;
          }
          save({
            ...profile,
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            username: profile.username.trim(),
            phone: profile.phone.trim(),
          });
        }}
      />
    </ScrollView>
  );
}
function ChatForm({
  data,
  chat,
  save,
  editProfile,
  editMessage,
  addMessage,
  remove,
}: {
  data: Document;
  chat: Chat;
  save: (c: Chat) => void;
  editProfile: (p: Profile) => void;
  editMessage: (m: Message) => void;
  addMessage: () => void;
  remove: () => void;
}) {
  const profile = data.profiles.find((p) => p.id === chat.profileId)!;
  const [presence, setPresence] = useState<Presence>(chat.presence);
  const [unread, setUnread] = useState(String(chat.unread));
  const [error, setError] = useState('');
  const messages = messagesFor(data, chat.id);
  return (
    <ScrollView contentContainerStyle={panel} keyboardShouldPersistTaps="handled">
      <View style={{ marginTop: 16 }}>
        <EditorRow
          title={nameOf(profile)}
          subtitle="Редактировать профиль и номер телефона"
          profile={profile}
          onPress={() => editProfile(profile)}
        />
      </View>
      <Segment
        label="Статус собеседника"
        options={PRESENCES}
        value={presence}
        onChange={setPresence}
      />
      <Field
        label="Количество непрочитанных сообщений"
        keyboardType="number-pad"
        value={unread}
        onChangeText={setUnread}
        maxLength={5}
      />
      <Text style={ed.hint}>
        Счётчик обнулится при открытии чата. Статус «Печатает…» останется активным, пока вы его не
        измените.
      </Text>
      {!!error && (
        <Text accessibilityRole="alert" style={ed.error}>
          {error}
        </Text>
      )}
      <Button
        title="Сохранить настройки чата"
        onPress={() => {
          if (!/^\d{1,5}$/.test(unread)) {
            setError('Введите целое число от 0 до 99999.');
            return;
          }
          setError('');
          save({ ...chat, presence, unread: Number(unread) });
        }}
      />
      <Text style={ed.section}>СООБЩЕНИЯ · {messages.length}</Text>
      <Button title="Добавить сообщение" onPress={addMessage} />
      {!messages.length && (
        <Text style={ed.hint}>
          Добавьте первое сообщение и выберите, от чьего лица оно отправлено.
        </Text>
      )}
      {messages.map((m) => (
        <EditorRow
          key={m.id}
          title={m.text}
          subtitle={`${m.direction === 'incoming' ? 'Собеседник' : 'Вы'} · ${new Date(m.sentAt).toLocaleDateString('ru-RU')} ${timeLabel(m.sentAt)} · ${m.receipt === 'read' ? '✓✓' : '✓'}`}
          onPress={() => editMessage(m)}
        />
      ))}
      <View style={{ marginTop: 20 }}>
        <Button danger title="Удалить чат" onPress={remove} />
      </View>
    </ScrollView>
  );
}
function MessageForm({
  initial,
  isNew,
  save,
  remove,
}: {
  initial: Message;
  isNew: boolean;
  save: (m: Message) => void;
  remove: () => void;
}) {
  const [text, setText] = useState(initial.text);
  const [direction, setDirection] = useState<Direction>(initial.direction);
  const [receipt, setReceipt] = useState<Receipt>(initial.receipt);
  const [edited, setEdited] = useState(initial.edited ? 'yes' : 'no');
  const parts = localParts(initial.sentAt);
  const [date, setDate] = useState(parts.date);
  const [time, setTime] = useState(parts.time);
  const [error, setError] = useState('');
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={panel}>
      <Segment
        label="Кто отправил"
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'incoming', label: 'Собеседник' },
          { value: 'outgoing', label: 'Я' },
        ]}
      />
      <Field
        label="Текст сообщения"
        testID="editor-message-input"
        placeholder="Введите сообщение"
        multiline
        value={text}
        onChangeText={setText}
        maxLength={10000}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="Дата (ГГГГ-ММ-ДД)"
            value={date}
            onChangeText={setDate}
            placeholder="2026-10-22"
            autoCorrect={false}
            maxLength={10}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="Время (ЧЧ:ММ)"
            value={time}
            onChangeText={setTime}
            placeholder="15:30"
            autoCorrect={false}
            maxLength={5}
          />
        </View>
      </View>
      <Text style={ed.hint}>
        Дата и время в часовом поясе устройства. Сообщения располагаются по заданному времени.
      </Text>
      <Segment
        label="Галочки исходящего сообщения"
        value={receipt}
        onChange={setReceipt}
        options={[
          { value: 'sent', label: '✓ Отправлено' },
          { value: 'read', label: '✓✓ Прочитано' },
        ]}
      />
      <Segment
        label="Пометка «изменено»"
        value={edited}
        onChange={setEdited}
        options={[
          { value: 'no', label: 'Скрыть' },
          { value: 'yes', label: 'Показать' },
        ]}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={ed.error}>
          {error}
        </Text>
      )}
      <Button
        title={isNew ? 'Добавить сообщение' : 'Сохранить сообщение'}
        onPress={() => {
          if (!text.trim()) {
            setError('Введите текст сообщения.');
            return;
          }
          // Changing only text/receipts must not round away seconds and move
          // the message before others in the same minute. New messages also
          // retain the timestamp captured when their form was opened.
          const sentAt =
            date === parts.date && time === parts.time ? initial.sentAt : parseLocal(date, time);
          if (!sentAt) {
            setError('Проверьте дату и время. Например: 2026-10-22, 15:30.');
            return;
          }
          save({
            ...initial,
            text: text.trim(),
            direction,
            receipt,
            sentAt,
            edited: edited === 'yes',
          });
        }}
      />
      {!isNew && <Button danger title="Удалить сообщение" onPress={remove} />}
    </ScrollView>
  );
}
const ed = StyleSheet.create({
  hint: { color: '#6D6D72', fontSize: 13, lineHeight: 19, marginTop: 9 },
  section: { color: '#6D6D72', fontSize: 12, fontWeight: '500', marginTop: 15 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 11,
  },
  rowTitle: { fontSize: 16, color: C.text },
  rowSubtitle: { fontSize: 12, color: C.muted, lineHeight: 17 },
  link: { padding: 14, alignItems: 'center' },
  error: { color: '#BA2525', fontSize: 14, lineHeight: 20 },
  notice: {
    backgroundColor: '#E2F5E5',
    color: '#26753D',
    paddingVertical: 9,
    paddingHorizontal: 18,
    fontSize: 13,
  },
  confirmOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.group,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  confirmTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
});
