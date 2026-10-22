# Сборка и установка

## Ручная сборка из GitHub

В Actions есть workflow **Build mobile apps** с выбором `android`, `ios` или `all`. Запуск вручную: Actions → Build mobile apps → Run workflow. Android job выдаёт тестово подписанный release APK, iOS job — неподписанную IPA для последующей подписи владельцем устройства. Workflow подготовлен, но нативная сборка и установка ещё не проверены. Автоматическая проверка `Checks` проверяет TypeScript, lint, тесты и web-export.

## Разработка на iPhone

`npm start`, затем открыть QR-код в Expo Go. Компьютер и телефон должны быть в одной сети. Это режим разработки, а не передача автономного приложения заказчику.

## Android APK

Локально, при установленном Android SDK и Java:

```sh
npx expo prebuild --platform android
npx expo run:android --variant release
```

Или EAS Build после настройки учётной записи Expo:

```sh
npx eas-cli@latest build --platform android --profile preview
```

Профиль `preview` создаёт APK. Перед публичной публикацией потребуется собственный постоянный ключ подписи; для передачи тестовой сборки используется internal distribution.

## iOS

Bundle ID: `com.daniil.chatstudio`. При необходимости измените его до первой выдачи сборки.

На macOS: `npx expo prebuild --platform ios`, открыть `ios/ChatStudio.xcworkspace` в Xcode, настроить Team и подпись. Для EAS: `npx eas-cli@latest build --platform ios --profile preview`; этот путь требует Apple Developer и регистрации устройства для Ad Hoc.

### IPA для самостоятельной подписи

Для установки через Sideloadly можно подготовить неподписанный пакет на Mac:

```sh
npx expo prebuild --platform ios
xcodebuild -workspace ios/ChatStudio.xcworkspace -scheme ChatStudio -configuration Release -sdk iphoneos -derivedDataPath build CODE_SIGNING_ALLOWED=NO build
mkdir -p artifacts/Payload
cp -R build/Build/Products/Release-iphoneos/ChatStudio.app artifacts/Payload/
cd artifacts
zip -r ChatStudio-unsigned.ipa Payload
```

Убедитесь, что имя workspace/scheme совпадает с результатом prebuild. Неподписанная IPA не устанавливается сама по себе: Sideloadly подписывает её Apple ID владельца и устанавливает на подключённый iPhone. На бесплатном Apple ID подпись действует 7 дней; дальнейшее обновление подписи выполняется через компьютер. Пароль Apple ID заказчика разработчику передавать не нужно: авторизация производится заказчиком на его компьютере.

Нативные сборки и конкретный способ установки необходимо проверить на реальном устройстве. Успешный web-export не подтверждает сборку IPA или APK.
