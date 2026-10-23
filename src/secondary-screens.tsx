import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SettingsIcon, type SettingsIconName } from './settings-icon';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar, Empty } from './ui';
import { Glass, GlassButton, GlassContent, useNotice, useUnavailable } from './glass';
import { type KitSymbolName } from './kit-symbol';
import { TelegramIcon } from './telegram-assets';
import { PublicHeader } from './public-ui';
import { colors as C, systemFont, type } from './theme';
import { nameOf, type Document } from './model';
import { openChat, openEditor } from './navigation';

export function ContactsScreen({ data }: { data: Document }) {
  const [reverse, setReverse] = useState(false);
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  const profiles = [...data.profiles].sort(
    (a, b) => (reverse ? -1 : 1) * nameOf(a).localeCompare(nameOf(b), 'ru'),
  );
  return (
    <View style={s.screen}>
      <GlassContent>
        <ScrollView contentContainerStyle={{ paddingTop: 64, paddingBottom: 88 + insets.bottom }}>
          <Pressable accessibilityRole="button" onPress={unavailable} style={s.contactRow}>
            <View style={s.inviteIcon}>
              <TelegramIcon name="invite" color={C.blue} />
            </View>
            <Text style={s.inviteText}>Пригласить друзей</Text>
          </Pressable>
          {!profiles.length && (
            <Empty
              title="Нет контактов"
              description="Созданные собеседники появятся здесь"
              icon="people-outline"
            />
          )}
          {profiles.map((profile) => {
            const chat = data.chats.find((c) => c.profileId === profile.id);
            return (
              <Pressable
                key={profile.id}
                accessibilityRole="button"
                accessibilityLabel={`Контакт ${nameOf(profile)}`}
                onPress={() =>
                  chat
                    ? openChat(chat.id)
                    : router.push({ pathname: '/profile/[id]', params: { id: profile.id } })
                }
                style={({ pressed }) => [s.contactRow, pressed && { backgroundColor: C.group }]}
              >
                <Avatar profile={profile} size={40} />
                <View style={s.contactText}>
                  <Text numberOfLines={1} style={s.contactName}>
                    {nameOf(profile)}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[s.contactStatus, chat?.presence === 'online' && { color: C.blue }]}
                  >
                    {chat?.presence === 'online'
                      ? 'в сети'
                      : chat?.presence === 'typing'
                        ? 'печатает…'
                        : 'был(а) недавно'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </GlassContent>
      <LinearGradient pointerEvents="none" colors={['#FFFFFF', '#FFFFFF00']} style={s.topFade} />
      <PublicHeader
        title="Контакты"
        onSecret={() => openEditor()}
        leading={
          <GlassButton
            title="Сорт."
            label="Изменить сортировку контактов"
            onPress={() => setReverse(!reverse)}
          />
        }
        trailing={<GlassButton telegramIcon="add" label="Добавить контакт" onPress={unavailable} />}
      />
    </View>
  );
}
export function CallsScreen() {
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  return (
    <View style={s.screen}>
      <GlassContent>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 110,
            paddingBottom: 103 + insets.bottom,
          }}
        >
          <Empty
            title="Нет недавних звонков"
            description="Ваши звонки появятся здесь"
            icon="call-outline"
          />
        </ScrollView>
      </GlassContent>
      <PublicHeader
        title="Звонки"
        onSecret={() => openEditor()}
        leading={<GlassButton title="Изм." label="Изменить звонки" onPress={unavailable} />}
        trailing={<GlassButton telegramIcon="add" label="Новый звонок" onPress={unavailable} />}
      />
    </View>
  );
}
const groups = [
  [{ title: 'Установить фотографию', icon: 'photo', color: C.blue, plain: true }],
  [{ title: 'Добавить аккаунт', icon: 'plus', color: C.blue, plain: true }],
  [{ title: 'Мой профиль', icon: 'profile', color: '#FF2D55', action: 'profile' }],
  [
    { title: 'Избранное', icon: 'saved', color: '#0088FF' },
    { title: 'Недавние звонки', icon: 'recentCalls', color: '#34C759', action: 'calls' },
    { title: 'Устройства', icon: 'devices', color: '#FF8D28' },
    { title: 'Папки с чатами', icon: 'folders', color: '#00C0E8' },
  ],
  [
    { title: 'Уведомления и звуки', icon: 'notifications', color: '#FF383C' },
    { title: 'Конфиденциальность', icon: 'privacy', color: '#8E8E93' },
    { title: 'Данные и память', icon: 'data', color: '#34C759' },
    { title: 'Оформление', icon: 'appearance', color: '#00C0E8' },
    { title: 'Энергосбережение', icon: 'power', color: '#FF8D28' },
    { title: 'Язык', icon: 'language', color: '#CB30E0' },
  ],
  [
    { title: 'Telegram Premium', icon: 'premium', color: '#8B5CE6' },
    { title: 'Мои звёзды', icon: 'stars', color: '#FFB000' },
    { title: 'Telegram для бизнеса', icon: 'business', color: '#A95CE3' },
    { title: 'Отправить подарок', icon: 'gift', color: '#34C27D' },
  ],
  [
    { title: 'Задать вопрос', icon: 'question', color: '#FF8D28' },
    { title: 'Вопросы о Telegram', icon: 'faq', color: '#00C0E8' },
    { title: 'Возможности Telegram', icon: 'features', color: '#FFCC00' },
  ],
  [{ title: 'О приложении', icon: 'question', color: '#8E8E93', action: 'about' }],
] satisfies {
  title: string;
  icon: SettingsIconName | KitSymbolName;
  color: string;
  plain?: boolean;
  action?: string;
}[][];
export function SettingsScreen({ data }: { data: Document }) {
  const showNotice = useNotice();
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.screen, { backgroundColor: C.group }]}>
      <GlassContent>
        <ScrollView contentContainerStyle={{ paddingBottom: 103 + insets.bottom }}>
          <View style={s.settingsHero}>
            <Avatar profile={data.self} size={100} />
            <Pressable onLongPress={() => openEditor()} delayLongPress={900} style={s.identity}>
              <Text style={s.selfName}>{nameOf(data.self)}</Text>
              <Text style={s.selfDetails}>
                {[data.self.phone, data.self.username && `@${data.self.username.replace(/^@/, '')}`]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            </Pressable>
          </View>
          <View style={s.groups}>
            {groups.map((group, gi) => (
              <View key={gi} style={s.group}>
                {group.map((row, ri) => (
                  <Pressable
                    key={row.title}
                    accessibilityRole="button"
                    onPress={() => {
                      const action = 'action' in row ? row.action : undefined;
                      if (action === 'profile')
                        router.push({ pathname: '/profile/[id]', params: { id: data.self.id } });
                      else if (action === 'calls') router.navigate('/calls');
                      else if (action === 'about')
                        showNotice(
                          'ChatStudio',
                          'Локальный симулятор переписок. Профили и сообщения создаются пользователем и не связаны с аккаунтами Telegram.',
                        );
                      else unavailable();
                    }}
                    style={s.settingsRow}
                  >
                    <View style={s.settingIcon}>
                      {'plain' in row && row.plain ? (
                        <Image
                          source={
                            row.icon === 'photo'
                              ? require('../assets/telegram-ios/photo.png')
                              : require('../assets/telegram-ios/plus.png')
                          }
                          tintColor={C.blue}
                          style={{ width: 30, height: 30 }}
                        />
                      ) : (
                        <SettingsIcon name={row.icon as SettingsIconName} />
                      )}
                    </View>
                    <View style={[s.settingBody, ri > 0 && s.separator]}>
                      <Text style={s.settingTitle}>{row.title}</Text>
                      {!('plain' in row && row.plain) && (
                        <TelegramIcon name="disclosure" color="#C7C7CC" />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </GlassContent>
      <View pointerEvents="box-none" style={s.settingsControls}>
        <Glass style={{ height: 44, width: 44 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="QR-код профиля"
            onPress={unavailable}
            style={s.qr}
          >
            <Image
              source={require('../assets/telegram-ios/qr.png')}
              tintColor={C.control}
              style={{ width: 24, height: 24 }}
            />
          </Pressable>
        </Glass>
        <GlassButton title="Изм." label="Изменить аккаунт" onPress={unavailable} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 58 },
  contactRow: {
    minHeight: 52,
    paddingLeft: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    flex: 1,
    minHeight: 52,
    justifyContent: 'center',
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  contactName: { ...type.body, fontFamily: systemFont, fontWeight: '400', color: C.text },
  contactStatus: { ...type.footnote, fontFamily: systemFont, color: C.muted },
  inviteIcon: { width: 42, alignItems: 'center' },
  inviteText: {
    ...type.body,
    fontFamily: systemFont,
    flex: 1,
    minHeight: 52,
    paddingTop: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  settingsHero: {
    minHeight: 209,
    paddingTop: 22,
    paddingBottom: 10,
    backgroundColor: C.profile,
    alignItems: 'center',
  },
  settingsControls: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  qr: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  identity: { alignItems: 'center', paddingTop: 9, paddingHorizontal: 16 },
  selfName: { ...type.title, fontFamily: systemFont, color: C.text, textAlign: 'center' },
  selfDetails: {
    ...type.body,
    fontFamily: systemFont,
    color: C.muted,
    textAlign: 'center',
    marginTop: 1,
  },
  groups: { padding: 16, gap: 24 },
  group: { borderRadius: 26, overflow: 'hidden', backgroundColor: 'white' },
  settingsRow: {
    minHeight: 52,
    paddingLeft: 16,
    gap: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 29,
    height: 29,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingBody: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 12,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  settingTitle: { ...type.body, fontFamily: systemFont, flex: 1, color: C.text },
});
