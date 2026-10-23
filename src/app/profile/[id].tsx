import { Redirect, useLocalSearchParams } from 'expo-router';
import { ProfileScreen } from '../../screens';
import { useStore } from '../../store';
import { goBack, openChat, openEditor } from '../../navigation';
export default function ProfilePage() {
  const { id, chatId } = useLocalSearchParams<{ id: string; chatId?: string }>();
  const { data } = useStore();
  const profile = id === data.self.id ? data.self : data.profiles.find((p) => p.id === id);
  const chat = data.chats.find((c) => (chatId ? c.id === chatId : c.profileId === id));
  if (!profile) return <Redirect href="/" />;
  return (
    <ProfileScreen
      profile={profile}
      openedFromChat={!!chatId}
      presence={chat?.presence}
      back={goBack}
      openEditor={() => openEditor(chatId)}
      message={
        chat
          ? () => {
              if (chatId) goBack();
              else openChat(chat.id);
            }
          : undefined
      }
    />
  );
}
