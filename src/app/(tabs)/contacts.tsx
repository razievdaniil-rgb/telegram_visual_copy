import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useStore } from '../../store';
import { nameOf } from '../../model';
import { openChat, openEditor } from '../../navigation';
import { Avatar, C, Empty, Header } from '../../ui';
export default function ContactsPage() {
  const { data } = useStore();
  return (
    <View style={{ flex: 1 }}>
      <Header title="Контакты" onSecret={() => openEditor()} />
      <ScrollView>
        {data.profiles.length ? (
          [...data.profiles]
            .sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'ru'))
            .map((p) => (
              <Pressable
                accessibilityRole="button"
                key={p.id}
                onPress={() => {
                  const chat = data.chats.find((c) => c.profileId === p.id);
                  if (chat) openChat(chat.id);
                  else router.push({ pathname: '/profile/[id]', params: { id: p.id } });
                }}
                style={{
                  padding: 13,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 13,
                  borderBottomWidth: 0.5,
                  borderBottomColor: C.line,
                  backgroundColor: 'white',
                }}
              >
                <Avatar profile={p} size={44} />
                <Text style={{ fontSize: 17 }}>{nameOf(p)}</Text>
              </Pressable>
            ))
        ) : (
          <Empty
            title="Нет контактов"
            description="Созданные в редакторе собеседники появятся здесь."
            icon="people-outline"
          />
        )}
      </ScrollView>
    </View>
  );
}
