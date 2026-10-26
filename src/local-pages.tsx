import { ChatsScreen } from './chat-list';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from './text';
import { Avatar, Button, Field } from './ui';
import { PublicHeader } from './public-ui';
import { GlassButton } from './glass';
import { useStore } from './store';
import { usePreferences } from './preferences';
import { nameOf, uid } from './model';
import { toggleId, type Folder } from './preferences-model';
import { goBack, openChat } from './navigation';
import { colors as C } from './theme';

export function LocalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {children}
      </ScrollView>
      <PublicHeader
        title={title}
        leading={<GlassButton icon="back" label="Назад" onPress={goBack} />}
      />
    </View>
  );
}
export function NewChatPage() {
  const { data, dispatch } = useStore();
  return (
    <LocalPage title="Новое сообщение">
      <View style={s.group}>
        {data.profiles.map((profile) => (
          <Pressable
            key={profile.id}
            accessibilityRole="button"
            style={s.contact}
            onPress={() => {
              const chat = data.chats.find((c) => c.profileId === profile.id) ?? {
                id: uid(),
                profileId: profile.id,
                presence: 'recently' as const,
                unread: 0,
                createdAt: new Date().toISOString(),
              };
              if (!data.chats.some((c) => c.id === chat.id)) dispatch({ type: 'chat/save', chat });
              router.replace({ pathname: '/chat/[id]', params: { id: chat.id } });
            }}
          >
            <Avatar profile={profile} size={44} />
            <Text style={s.body}>{nameOf(profile)}</Text>
          </Pressable>
        ))}
      </View>
      {!data.profiles.length && <Text style={s.note}>Нет контактов</Text>}
    </LocalPage>
  );
}
export function AppearancePage() {
  const { preferences, change } = usePreferences();
  return (
    <LocalPage title="Оформление">
      <Text style={s.caption}>РАЗМЕР ТЕКСТА</Text>
      <View style={[s.group, s.sizes]}>
        {[15, 16, 17, 18, 19, 20, 21, 22].map((size) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Размер текста ${size}`}
            accessibilityState={{ selected: preferences.fontSize === size }}
            key={size}
            onPress={() => change((p) => ({ ...p, fontSize: size }))}
            style={[s.size, preferences.fontSize === size && s.selected]}
          >
            <Text
              style={{ fontSize: size, color: preferences.fontSize === size ? 'white' : C.blue }}
            >
              {size}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={s.group}>
        <Text
          style={[
            s.body,
            { padding: 16, fontSize: preferences.fontSize, lineHeight: preferences.fontSize + 5 },
          ]}
        >
          Так будут выглядеть сообщения в ваших чатах.
        </Text>
      </View>
      <Text style={s.caption}>ОБОИ ДЛЯ ЧАТОВ</Text>
      <View style={s.group}>
        {(['telegram', 'plain', 'blue'] as const).map((wallpaper, index) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: preferences.wallpaper === wallpaper }}
            key={wallpaper}
            style={s.row}
            onPress={() => change((p) => ({ ...p, wallpaper }))}
          >
            <Text style={s.body}>{['Классические', 'Однотонные', 'Голубые'][index]}</Text>
            <Text style={{ color: C.blue }}>{preferences.wallpaper === wallpaper ? '✓' : ''}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.note}>Светлая тема</Text>
    </LocalPage>
  );
}
export function FoldersPage() {
  const { data } = useStore();
  const { preferences, change } = usePreferences();
  const [draft, setDraft] = useState<Folder | null>(null);
  const [error, setError] = useState('');
  return (
    <LocalPage title={draft ? 'Папка чатов' : 'Папки чатов'}>
      {draft ? (
        <>
          <Field
            label="Название папки"
            value={draft.title}
            maxLength={40}
            onChangeText={(title) => setDraft({ ...draft, title })}
          />
          <Text style={s.caption}>ВКЛЮЧЁННЫЕ ЧАТЫ</Text>
          <View style={s.group}>
            {data.chats.map((chat) => {
              const profile = data.profiles.find((p) => p.id === chat.profileId)!;
              return (
                <Pressable
                  key={chat.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: draft.chatIds.includes(chat.id) }}
                  style={s.row}
                  onPress={() => setDraft({ ...draft, chatIds: toggleId(draft.chatIds, chat.id) })}
                >
                  <Text style={s.body}>{nameOf(profile)}</Text>
                  <Text style={{ color: C.blue }}>
                    {draft.chatIds.includes(chat.id) ? '✓' : '○'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={{ color: C.red }}>
              {error}
            </Text>
          )}
          <Button
            title="Сохранить папку"
            onPress={() => {
              if (!draft.title.trim()) {
                setError('Введите название папки');
                return;
              }
              const folder = { ...draft, title: draft.title.trim() };
              change((p) => ({
                ...p,
                folders: p.folders.some((f) => f.id === folder.id)
                  ? p.folders.map((f) => (f.id === folder.id ? folder : f))
                  : [...p.folders, folder],
              }));
              setDraft(null);
              setError('');
            }}
          />
          <Button
            title="Отмена"
            onPress={() => {
              setDraft(null);
              setError('');
            }}
          />
        </>
      ) : (
        <>
          <Text style={s.note}>Разделите личные переписки по папкам.</Text>
          <View style={s.group}>
            {preferences.folders.map((folder) => (
              <View key={folder.id}>
                <Pressable
                  accessibilityRole="button"
                  style={s.row}
                  onPress={() => {
                    setDraft({ ...folder, chatIds: [...folder.chatIds] });
                    setError('');
                  }}
                >
                  <Text style={s.body}>{folder.title}</Text>
                  <Text style={s.note}>
                    {folder.chatIds.filter((id) => data.chats.some((c) => c.id === id)).length} ›
                  </Text>
                </Pressable>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 10 }}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      change((p) => {
                        const folders = [...p.folders];
                        const i = folders.findIndex((f) => f.id === folder.id);
                        if (i > 0) [folders[i - 1], folders[i]] = [folders[i], folders[i - 1]];
                        return { ...p, folders };
                      })
                    }
                  >
                    <Text style={{ color: C.blue }}>Выше</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      change((p) => ({
                        ...p,
                        folders: p.folders.filter((f) => f.id !== folder.id),
                      }))
                    }
                  >
                    <Text style={{ color: C.red }}>Удалить папку</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
          <Button
            title="Создать папку"
            onPress={() => setDraft({ id: uid(), title: '', chatIds: [] })}
          />
        </>
      )}
    </LocalPage>
  );
}
export function DataPage() {
  const { data } = useStore();
  const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
  return (
    <LocalPage title="Данные и память">
      <Text style={s.caption}>НА ЭТОМ УСТРОЙСТВЕ</Text>
      <View style={s.group}>
        {[
          ['Переписки', data.chats.length],
          ['Сообщения', data.messages.length],
          ['Профили', data.profiles.length],
          ['Данные и аватары', `${(bytes / 1024).toFixed(1)} КБ`],
        ].map(([label, value]) => (
          <View key={String(label)} style={s.row}>
            <Text style={s.body}>{label}</Text>
            <Text style={s.note}>{value}</Text>
          </View>
        ))}
      </View>
      <Text style={s.note}>
        Переписки и фотографии хранятся локально. Экспорт и восстановление доступны в редакторе.
      </Text>
    </LocalPage>
  );
}
export function ArchivePage() {
  return <ArchiveContent />;
}
// Separate component keeps the route wrapper out of the chat list dependency graph.
function ArchiveContent() {
  const { data } = useStore();
  return <ChatsScreen data={data} openChat={openChat} openEditor={() => {}} archive />;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.group },
  content: { paddingTop: 76, paddingHorizontal: 16, paddingBottom: 48, gap: 12 },
  group: { backgroundColor: 'white', borderRadius: 14, overflow: 'hidden' },
  row: {
    minHeight: 52,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  body: { fontSize: 17, color: C.text, flexShrink: 1 },
  caption: { color: '#6D6D72', fontSize: 13, marginTop: 16, marginLeft: 16 },
  note: { fontSize: 13, lineHeight: 18, color: C.muted },
  contact: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sizes: { flexDirection: 'row', padding: 8, gap: 2, flexWrap: 'wrap' },
  size: {
    minWidth: 32,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  selected: { backgroundColor: C.blue },
});
