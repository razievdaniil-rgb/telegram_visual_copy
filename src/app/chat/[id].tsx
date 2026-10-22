import { useCallback } from 'react';
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { DialogueScreen } from '../../screens';
import { useStore } from '../../store';
import { uid } from '../../model';
import { goBack, openEditor } from '../../navigation';
export default function ChatPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, dispatch } = useStore();
  const chat = data.chats.find((c) => c.id === id);
  useFocusEffect(
    useCallback(() => {
      dispatch({ type: 'chat/read', id });
    }, [dispatch, id]),
  );
  if (!chat) return <Redirect href="/" />;
  return (
    <DialogueScreen
      data={data}
      chat={chat}
      back={goBack}
      openProfile={() =>
        router.push({ pathname: '/profile/[id]', params: { id: chat.profileId, chatId: id } })
      }
      openEditor={() => openEditor(id)}
      send={(text) =>
        dispatch({
          type: 'message/save',
          message: {
            id: uid(),
            chatId: id,
            direction: 'outgoing',
            text,
            sentAt: new Date().toISOString(),
            receipt: 'sent',
            edited: false,
          },
        })
      }
    />
  );
}
