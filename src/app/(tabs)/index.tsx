import { ChatsScreen } from '../../screens';
import { useStore } from '../../store';
import { openChat, openEditor } from '../../navigation';
export default function ChatsPage() {
  const { data } = useStore();
  return <ChatsScreen data={data} openChat={openChat} openEditor={() => openEditor()} />;
}
