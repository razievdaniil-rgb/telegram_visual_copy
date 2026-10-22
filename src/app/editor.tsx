import { useLocalSearchParams } from 'expo-router';
import { Editor } from '../Editor';
import { exampleDocument } from '../example';
import { goBack } from '../navigation';
import { useStore } from '../store';
export default function EditorPage() {
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();
  const { data, dispatch } = useStore();
  return (
    <Editor
      data={data}
      dispatch={dispatch}
      close={goBack}
      currentChatId={chatId}
      addExample={() => {
        if (!data.chats.length && !data.profiles.length)
          dispatch({ type: 'document/load', document: { ...exampleDocument(), self: data.self } });
      }}
    />
  );
}
