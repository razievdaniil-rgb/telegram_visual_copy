import React, { useState } from 'react';
import { View } from 'react-native';
import { useStore } from './store';
import { usePreferences } from './preferences';
import { Button } from './ui';
import { Text } from './text';
import { encodeBackup, decodeBackup } from './backup-model';
import { saveWorkspace } from './storage';
export function BackupPanel() {
  const { data, dispatch } = useStore();
  const { preferences, replace } = usePreferences();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ReturnType<typeof decodeBackup> | null>(null);
  const [ready, setReady] = useState(false);
  return (
    <View style={{ gap: 12, marginTop: 16 }}>
      <Text style={{ fontSize: 17, fontWeight: '600' }}>Резервная копия</Text>
      <Text>
        Данные сохраняются на этом устройстве. Сохраните копию перед переустановкой или сменой
        адреса приложения.
      </Text>
      <Button
        disabled={busy}
        title="Скачать резервную копию"
        onPress={() => {
          const url = URL.createObjectURL(
            new Blob([encodeBackup(data, preferences)], { type: 'application/json' }),
          );
          const link = document.createElement('a');
          link.href = url;
          link.download = 'telegram-backup.json';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }}
      />
      <Button
        disabled={busy}
        title="Восстановить из файла"
        onPress={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,application/json';
          input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            if (file.size > 50 * 1024 * 1024) {
              setNotice('Файл больше 50 МБ');
              return;
            }
            void file
              .text()
              .then((raw) => {
                setPending(decodeBackup(raw));
                setNotice('Копия проверена. Текущие переписки будут заменены после подтверждения.');
              })
              .catch(() => setNotice('Не удалось прочитать копию. Текущие данные не изменены.'));
          };
          input.click();
        }}
      />
      {pending && (
        <>
          <Button
            danger
            disabled={busy}
            title="Заменить текущие данные"
            onPress={() => {
              setBusy(true);
              void saveWorkspace(pending.document, pending.preferences)
                .then(() => {
                  dispatch({ type: 'document/load', document: pending.document });
                  replace(pending.preferences);
                  setPending(null);
                  setNotice('Копия восстановлена');
                })
                .catch(() => setNotice('Не удалось сохранить копию. Текущие данные не изменены.'))
                .finally(() => setBusy(false));
            }}
          />
          <Button
            title="Отмена восстановления"
            onPress={() => {
              setPending(null);
              setNotice('');
            }}
          />
        </>
      )}
      <Button
        disabled={busy}
        title="Проверить обновление приложения"
        onPress={() => {
          if (!('serviceWorker' in navigator)) {
            setNotice('Обновления недоступны в этом браузере');
            return;
          }
          void navigator.serviceWorker
            .getRegistration()
            .then(async (registration) => {
              if (!registration) {
                setNotice(
                  'Офлайн-оболочка ещё не установлена. Откройте production-сборку по HTTPS.',
                );
                return;
              }
              await registration.update();
              setReady(!!registration.waiting);
              setNotice(
                registration.waiting
                  ? 'Доступна новая версия. Перед обновлением данные будут сохранены.'
                  : 'Новая версия пока не обнаружена. Повторите проверку после загрузки обновления.',
              );
            })
            .catch(() =>
              setNotice('Не удалось проверить обновление. Проверьте подключение к сети.'),
            );
        }}
      />
      {ready && (
        <Button
          disabled={busy}
          title="Сохранить и обновить"
          onPress={() => {
            setBusy(true);
            void saveWorkspace(data, preferences)
              .then(async () => {
                const registration = await navigator.serviceWorker.getRegistration();
                if (!registration?.waiting) throw new Error();
                navigator.serviceWorker.addEventListener(
                  'controllerchange',
                  () => window.location.reload(),
                  { once: true },
                );
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              })
              .catch(() => {
                setBusy(false);
                setNotice(
                  'Обновление отменено: не удалось сохранить данные или получить новую версию.',
                );
              });
          }}
        />
      )}
      {!!notice && <Text accessibilityRole="alert">{notice}</Text>}
    </View>
  );
}
