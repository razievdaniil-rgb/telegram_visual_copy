import { useStore } from '../../store';
import { SettingsScreen } from '../../secondary-screens';
export default function SettingsPage() {
  const { data } = useStore();
  return <SettingsScreen data={data} />;
}
