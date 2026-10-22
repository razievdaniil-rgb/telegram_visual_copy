import { ScrollView, Text, View } from 'react-native';
import { useStore } from '../../store';
import { nameOf } from '../../model';
import { openEditor } from '../../navigation';
import { Avatar, C, Header } from '../../ui';
export default function SettingsPage() {
  const { data } = useStore();
  return (
    <View style={{ flex: 1, backgroundColor: C.group }}>
      <Header title="Настройки" onSecret={() => openEditor()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Avatar profile={data.self} size={70} />
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={{ fontSize: 22, fontWeight: '600' }}>{nameOf(data.self)}</Text>
            <Text style={{ color: C.muted }}>{data.self.phone || 'Номер не указан'}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: '600' }}>О приложении</Text>
          <Text style={{ fontSize: 14, lineHeight: 21, color: '#636366' }}>
            Локальный симулятор переписок. Профили и сообщения создаются пользователем и не связаны
            с аккаунтами Telegram.
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 21, color: '#636366' }}>
            Версия 1.0.0 · Данные сохраняются на этом устройстве.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
