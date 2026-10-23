import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from './ui';
import { GlassButton, GlassContent, useUnavailable } from './glass';
import { nameOf, type Chat, type Profile } from './model';
import { colors as C, systemFont, type } from './theme';
import { TelegramIcon, type TelegramIconName } from './telegram-assets';
export function ProfileScreen({
  profile,
  presence,
  back,
  message,
  openEditor,
  openedFromChat = false,
}: {
  profile: Profile;
  presence?: Chat['presence'];
  back: () => void;
  message?: () => void;
  openEditor: () => void;
  openedFromChat?: boolean;
}) {
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  const actions: { icon: TelegramIconName; label: string; onPress?: () => void }[] = openedFromChat
    ? [
        { icon: 'call', label: 'звонок' },
        { icon: 'video', label: 'видео' },
        { icon: 'mute', label: 'звук' },
        { icon: 'search', label: 'поиск' },
        { icon: 'more', label: 'ещё' },
      ]
    : [
        { icon: 'message', label: 'сообщение', onPress: message },
        { icon: 'call', label: 'звонок' },
        { icon: 'video', label: 'видео' },
        { icon: 'mute', label: 'звук' },
        { icon: 'more', label: 'ещё' },
      ];
  return (
    <View style={s.screen}>
      <GlassContent>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <View style={s.hero}>
            <Avatar profile={profile} size={100} />
            <Pressable onLongPress={openEditor} delayLongPress={900} style={s.identity}>
              <Text style={s.name}>{nameOf(profile)}</Text>
              <Text
                style={[
                  s.status,
                  (presence === 'online' || presence === 'typing') && { color: C.blue },
                ]}
              >
                {presence === 'online'
                  ? 'в сети'
                  : presence === 'typing'
                    ? 'печатает…'
                    : 'был(а) недавно'}
              </Text>
            </Pressable>
            <View style={s.actions}>
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  onPress={action.onPress ?? unavailable}
                  style={s.action}
                >
                  <View style={s.actionIcon}>
                    <TelegramIcon name={action.icon} color={C.blue} frame={40} />
                  </View>
                  <Text numberOfLines={1} style={s.actionLabel}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={s.card}>
            {[
              { label: 'мобильный', value: profile.phone, link: true },
              {
                label: 'имя пользователя',
                value: profile.username ? `@${profile.username.replace(/^@/, '')}` : '',
                link: true,
              },
              { label: 'о себе', value: profile.bio, link: false },
            ]
              .filter((item) => !!item.value)
              .map((item, index) => (
                <View key={item.label} style={[s.info, index > 0 && s.separator]}>
                  <Text style={s.label}>{item.label}</Text>
                  <Text selectable style={[s.value, item.link && { color: C.blue }]}>
                    {item.value}
                  </Text>
                </View>
              ))}
          </View>
        </ScrollView>
      </GlassContent>
      <View pointerEvents="box-none" style={s.controls}>
        <GlassButton icon="back" label="Назад" onPress={back} />
        <GlassButton title="Изм." label="Изменить профиль" onPress={unavailable} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.group },
  hero: { minHeight: 288, paddingTop: 22, alignItems: 'center' },
  identity: { paddingTop: 9, paddingHorizontal: 16, width: '100%', alignItems: 'center' },
  name: { ...type.title, fontFamily: systemFont, color: C.text, textAlign: 'center' },
  status: {
    ...type.body,
    fontFamily: systemFont,
    color: C.muted,
    textAlign: 'center',
    marginTop: 1,
  },
  controls: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 'auto',
    paddingTop: 16,
    paddingBottom: 16,
    width: '100%',
  },
  action: { flex: 1, height: 58, borderRadius: 16, backgroundColor: 'white', alignItems: 'center' },
  actionIcon: { position: 'absolute', top: 1 },
  actionLabel: {
    position: 'absolute',
    bottom: 9,
    fontFamily: systemFont,
    color: C.blue,
    fontSize: 11,
    lineHeight: 13,
  },
  card: {
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 26,
    paddingHorizontal: 16,
  },
  info: { paddingVertical: 15, gap: 3 },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  label: { fontSize: 14, lineHeight: 17, fontFamily: systemFont, color: C.text },
  value: { ...type.body, fontFamily: systemFont, color: C.text },
});
