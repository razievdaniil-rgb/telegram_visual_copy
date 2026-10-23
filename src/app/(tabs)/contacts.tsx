import { useStore } from '../../store';
import { ContactsScreen } from '../../secondary-screens';
export default function ContactsPage() {
  const { data } = useStore();
  return <ContactsScreen data={data} />;
}
