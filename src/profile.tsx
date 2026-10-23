import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, Icon } from './ui';
import { Glass, GlassButton, GlassContent, KitIcon, useUnavailable } from './glass';
import { nameOf, type Chat, type Profile } from './model';
import { colors as C, systemFont, type } from './theme';
import { ProfilePattern } from './profile-pattern';

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
  const unavailable = useUnavailable();
  const insets = useSafeAreaInsets();
  return (
    <View style={s.screen}>
      <GlassContent>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <View style={s.hero}>
            <ProfilePattern variant="profile" />
            <View style={s.avatar}>
              <Avatar profile={profile} size={90} />
            </View>
            <Pressable onLongPress={openEditor} delayLongPress={900} style={s.identity}>
              <Text style={s.name}>{nameOf(profile)}</Text>
              <Text style={s.status}>
                {presence === 'online'
                  ? 'в сети'
                  : presence === 'typing'
                    ? 'печатает…'
                    : 'был(а) недавно'}
              </Text>
            </Pressable>
            <View style={s.actions}>
              {(
                [
                  { icon: 'calls', label: 'звонок' },
                  { icon: 'video', label: 'видео' },
                  { icon: null, label: 'звук' },
                  { icon: 'search', label: 'поиск' },
                  { icon: 'more', label: 'ещё' },
                ] as const
              ).map((action) => (
                <Glass key={action.label} dark capture={false} style={s.actionGlass}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    onPress={unavailable}
                    style={s.action}
                  >
                    {action.icon ? (
                      <KitIcon name={action.icon} color="white" />
                    ) : (
                      <Icon name="notifications" size={28} color="white" />
                    )}
                    <Text style={s.actionLabel}>{action.label}</Text>
                  </Pressable>
                </Glass>
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
            ].map((item, index) => (
              <View key={item.label} style={[s.info, index > 0 && s.separator]}>
                <Text style={s.label}>{item.label}</Text>
                <Text selectable style={[s.value, item.link && { color: C.blue }]}>
                  {item.value || 'Не указано'}
                </Text>
              </View>
            ))}
          </View>
          {message && (
            <Pressable accessibilityRole="button" onPress={message} style={s.message}>
              <Text style={[type.body, { color: C.blue, textAlign: 'center' }]}>
                Отправить сообщение
              </Text>
            </Pressable>
          )}
          <Glass capture={false} style={s.mediaTabs}>
            {['Публикации', 'Подарки', 'Медиа', 'Файлы'].map((label, index) => (
              <Pressable
                key={label}
                accessibilityRole="tab"
                accessibilityState={{ selected: index === 0 }}
                onPress={unavailable}
                style={[s.mediaTab, index === 0 && { backgroundColor: '#E4E4E4' }]}
              >
                <Text numberOfLines={1} style={s.mediaLabel}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </Glass>
          <Text style={s.emptyMedia}>Пока нет публикаций</Text>
        </ScrollView>
      </GlassContent>
      <View pointerEvents="box-none" style={s.controls}>
        <GlassButton icon="back" label="Назад" dark onPress={back} />
        <GlassButton title="Изм." label="Изменить профиль" dark onPress={unavailable} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.group },
  hero: { backgroundColor: C.profile, paddingTop: 8, alignItems: 'center' },
  avatar: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  identity: { paddingVertical: 8, paddingHorizontal: 16, width: '100%', alignItems: 'center' },
  name: { ...type.title, fontFamily: systemFont, color: 'white', textAlign: 'center' },
  status: { ...type.preview, fontFamily: systemFont, color: 'white', textAlign: 'center' },
  controls: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    width: '100%',
  },
  actionGlass: { flex: 1, borderRadius: 24, backgroundColor: '#00A8D4', boxShadow: 'none' },
  action: { minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: systemFont, color: 'white', fontSize: 12, lineHeight: 16 },
  card: { backgroundColor: 'white', margin: 16, borderRadius: 26, paddingHorizontal: 16 },
  info: { paddingVertical: 13, gap: 2 },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  label: { ...type.preview, fontFamily: systemFont, color: C.text },
  value: { ...type.body, fontFamily: systemFont, color: C.text },
  message: {
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 26,
    paddingVertical: 15,
  },
  mediaTabs: { flexDirection: 'row', padding: 3, height: 41, margin: 16 },
  mediaTab: { flex: 1, borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  mediaLabel: { fontFamily: systemFont, fontSize: 13, fontWeight: '500', color: C.text },
  emptyMedia: {
    ...type.preview,
    fontFamily: systemFont,
    textAlign: 'center',
    color: C.muted,
    padding: 24,
  },
});
