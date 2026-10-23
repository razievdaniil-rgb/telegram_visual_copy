import { Tabs } from 'expo-router';
import { FloatingTabs } from '../../public-ui';
export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <FloatingTabs {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'white' } }}
    >
      <Tabs.Screen name="contacts" options={{ title: 'Контакты' }} />
      <Tabs.Screen name="calls" options={{ title: 'Звонки' }} />
      <Tabs.Screen name="index" options={{ title: 'Чаты' }} />
      <Tabs.Screen name="settings" options={{ title: 'Настройки' }} />
    </Tabs>
  );
}
