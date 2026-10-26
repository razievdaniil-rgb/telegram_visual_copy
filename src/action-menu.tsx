import React, { useState } from 'react';
import { Modal, Pressable, View, StyleSheet } from 'react-native';
import { Text } from './text';
import { colors } from './theme';
type Item = { title: string; action: () => void; danger?: boolean };
export function ActionMenu({
  title,
  items,
  close,
}: {
  title: string;
  items: Item[];
  close: () => void;
}) {
  const [confirm, setConfirm] = useState<Item | null>(null);
  return (
    <Modal transparent animationType="fade" onRequestClose={close}>
      <View style={s.overlay}>
        <Pressable
          accessibilityLabel="Закрыть меню"
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityViewIsModal style={s.sheet}>
          <View style={s.group}>
            <Text style={s.caption}>{confirm ? 'Подтвердите действие' : title}</Text>
            {(confirm ? [confirm] : items).map((item) => (
              <Pressable
                key={item.title}
                accessibilityRole="button"
                onPress={() => {
                  if (item.danger && !confirm) {
                    setConfirm(item);
                    return;
                  }
                  close();
                  item.action();
                }}
                style={s.row}
              >
                <Text style={[s.text, { color: item.danger ? colors.red : colors.blue }]}>
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            style={[s.group, s.row]}
            onPress={confirm ? () => setConfirm(null) : close}
          >
            <Text style={[s.text, { fontWeight: '600' }]}>Отмена</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  sheet: {
    padding: 8,
    paddingBottom: 32,
    gap: 8,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  group: { backgroundColor: '#F5F5F5', borderRadius: 14, overflow: 'hidden' },
  caption: { fontSize: 13, color: colors.muted, textAlign: 'center', padding: 14 },
  row: {
    minHeight: 55,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  text: { fontSize: 20, color: colors.blue },
});
