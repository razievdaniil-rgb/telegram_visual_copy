import { useLocalSearchParams } from 'expo-router';
import { Editor } from '../Editor';
import { exampleDocument } from '../example';
import { goBack } from '../navigation';
import { useStore } from '../store';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function EditorPage() {
  const { chatId } = useLocalSearchParams<{ chatId?: string }>();
  const { data, dispatch } = useStore();
  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={{ flex: 1, backgroundColor: '#EFEFF4' }}
    >
      <Editor
        data={data}
        dispatch={dispatch}
        close={goBack}
        currentChatId={chatId}
        addExample={() => {
          if (!data.chats.length && !data.profiles.length)
            dispatch({
              type: 'document/load',
              document: { ...exampleDocument(), self: data.self },
            });
        }}
      />
    </SafeAreaView>
  );
}
