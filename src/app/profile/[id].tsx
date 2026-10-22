import { Redirect, useLocalSearchParams } from 'expo-router';
import { ProfileScreen } from '../../screens';
import { useStore } from '../../store';
import { goBack, openEditor } from '../../navigation';
export default function ProfilePage() {
  const { id, chatId } = useLocalSearchParams<{ id: string; chatId?: string }>();
  const { data } = useStore();
  const profile = data.profiles.find((p) => p.id === id);
  const chat = data.chats.find((c) => c.id === chatId);
  if (!profile) return <Redirect href="/" />;
  return (
    <ProfileScreen
      profile={profile}
      presence={chat?.presence}
      back={goBack}
      openEditor={() => openEditor(chatId)}
      message={
        chat
          ? () => {
              goBack();
            }
          : undefined
      }
    />
  );
}
