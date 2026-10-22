import { Tabs } from 'expo-router';
import { C, Icon } from '../../ui';
export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.surface, height: 51, paddingTop: 3, paddingBottom: 3 },
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Контакты',
          tabBarIcon: ({ color }) => <Icon name="people-outline" color={color} size={25} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Чаты',
          tabBarIcon: ({ color }) => <Icon name="chatbubbles-outline" color={color} size={25} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ color }) => <Icon name="settings-outline" color={color} size={25} />,
        }}
      />
    </Tabs>
  );
}
