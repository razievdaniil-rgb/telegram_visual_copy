# Передача проекта в Claude — белый экран на iPhone

Обновлено 30 октября 2026. Этот документ предназначен для продолжения разработки, не для отправки заказчику.

## Запрос следующему агенту

Найди и исправь причину белого экрана при запуске на физическом iPhone. Сохрани оригинальный интерфейс Telegram и весь локальный редактор. Подготовь **один новый iPhone IPA** со всеми имеющимися исправлениями и исправлением запуска. Не возвращай проект к Expo/PWA и не переписывай интерфейс. Не объявляй проблему исправленной по успешной компиляции или работе Simulator: нужно подтверждение запуска установленной и подписанной сборки на телефоне.

## 1. Факты о новом сбое

- Пользователь сообщил, что установленное приложение не открывается: белый экран.
- Скриншот показывает белую поверхность и нижний системный индикатор Home. Сам по себе он не позволяет отличить зависшую загрузку, пустой контроллер, ошибку хранилища или падение.
- Запись `C:/Users/Daniil/Downloads/IMG_0592.MP4` просмотрена через шесть извлечённых кадров. Видна иконка Telegram, затем белая поверхность. Длительность **5,8 с**, видео H.264 368×352, есть AAC-аудиодорожка. Аудио не анализировалось. Это короткая обрезанная запись; нельзя утверждать по ней длительность зависания или отсутствие системного завершения процесса.
- SHA256 записи: `f8a662b920c24d0c350d8230a33dd6474821bbf18bd9494fde806ae26889c7f1`.
- Скриншот: `C:/Users/Daniil/AppData/Local/Temp/codex-clipboard-5147b0cc-9cea-4fb9-8948-17d6ae057fde.png`.
- Контактный лист записи: `C:/Users/Daniil/telegram_visual_copy/artifacts/client-gear/phone-failure-contact.jpg`.
- Ранее целевым устройством назывался iPhone 13 Pro Max с последней iOS. **Фактические модель, точная iOS, способ установки, параметры подписи, установленный build и история переустановок пока не подтверждены.** Обсуждались Sideloadly и SideStore, но это не доказательство использованного способа.
- Физические crash/console/watchdog-логи и подписанный IPA пока не получены. Причина не установлена. На этом этапе исходники приложения для исправления сбоя не менялись и новая сборка не запускалась.

Исходное видео/скриншот не добавлять в публичный Git без необходимости. На другом компьютере эти локальные пути недоступны — попросить пользователя приложить файлы.

## 2. Репозиторий, исходники и итоговые файлы

- Репозиторий: https://github.com/razievdaniil-rgb/telegram_visual_copy
- Локальная папка: `C:/Users/Daniil/telegram_visual_copy`.
- Последний коммит перед этой передачей: `c4dff2b256488208f4542fc80df8ca36f50fe4ee`. Изменения этой передачи будут отдельным последующим коммитом.
- **Исходники скомпилированного приложения:** `363617534c57261ed3c39ea803626f69971f6be2`. Последующие коммиты до c4dff2b изменяли QA, монтаж и документацию, а не код приложения.
- Основа: оригинальный Telegram iOS **13.1.1**, upstream `fb0e62ba8a147f0821da6aa63c09da7d79a10111`, https://github.com/TelegramMessenger/Telegram-iOS.
- iPhone **build 12**, версия 13.1.1, arm64 / IOS, сборка debug_arm64 без установочной подписи.
- Переданный файл: `C:/Users/Daniil/Downloads/Telegram-client.ipa`.
- Размер **609032044** байта; SHA256 **`4303cd192001efdef8eaabab7f8e3c8dd2dc6ecbbd7fdb571e5780d4bee07789`**.
- Исходный распакованный артефакт: `artifacts/client-gear/device12/Telegram.ipa`.
- Device run: https://github.com/razievdaniil-rgb/telegram_visual_copy/actions/runs/40787740421 ; artifact 12861804209. Артефакты хранятся ограниченное время, локальная копия уже есть.
- Simulator **build 22**, тот же app-source SHA: run https://github.com/razievdaniil-rgb/telegram_visual_copy/actions/runs/40787740414 . Это отдельный IOSSIMULATOR executable. **Device IPA в Simulator не запускался.**
- Последний ролик: `C:/Users/Daniil/Downloads/Telegram-client-demo.mp4`, копия `docs/videos/Telegram-native-client-demo.mp4`, 179,7 с / 5391 кадров / 30 fps / H.264 Main / faststart, 6595018 байт.
- Ролик онлайн: https://raw.githubusercontent.com/razievdaniil-rgb/telegram_visual_copy/main/docs/videos/Telegram-native-client-demo.mp4
- SHA256 ролика: `d7f90b46a9ae9a3084153de9ff1d57998ecd056607f864971ed299abe0898a3a`.
- Текстовая инструкция: `C:/Users/Daniil/Downloads/Инструкция-Telegram-iPhone.txt`, версия в `docs/Инструкция-Telegram-iPhone.txt`. Ранее пользователь попросил PDF-инструкцию, но запрос был прерван; создание PDF пока не подтверждено. После исправления запуска обновить инструкцию и подготовить PDF.

**Не выдавать старые IPA build 7/8/9 как итоговый build 12.** Сравнить хеш исходного переданного файла. Подписанный/перепакованный IPA закономерно имеет другой хеш; его соответствие устанавливать по версии, коду/ресурсам и процедуре подписи, а не равенству ZIP-хеша.

## 3. Архитектура — это нативный форк, несмотря на названия Simulator

Активная реализация — `native/`: Swift, UIKit, Texture/AsyncDisplayKit, Postbox, SwiftSignalKit, штатные публичные экраны Telegram. React Native, Expo, Expo Router и PWA в остальных папках — **архив предыдущего прототипа**, не исполняются внутри IPA. `TelegramSimulator.enabled = true` — название локального режима, он включён и на физическом iPhone; это не условие `targetEnvironment(simulator)`.

Настоящего входа в Telegram, SMS, сервера и синхронизации нет. api_id=1, нулевой api_hash, team_id=XXXXXXXXXX — сборочные заглушки. Не подставлять реальные Telegram API/Apple ID, чтобы «починить» локальный запуск. Сеть в локальных точках перехватывается. Нужна проверка, что ни одна обязательная стадия запуска не ждёт подавленного сетевого ответа.

### Основные файлы

- `native/upstream.json` — строгий pin upstream.
- `native/patches/0001-local-simulator.patch` — изменения 26 исходных файлов и Make.py.
- `native/Sources/Core/SimulatorDocument.swift` — документ v1, модели, валидация, репозиторий.
- `native/Sources/Core/TelegramSimulator.swift` — локальная авторизация, подготовка аккаунта, проекция документа в Postbox, сообщения, профили, статусы.
- `native/Sources/Core/SimulatorUIConfiguration.swift` — default gear и выбор собственного контейнера.
- `native/Sources/Core/SimulatorLocalization.swift` — локальная русская локализация.
- `native/Sources/Core/SimulatorWallpapers.swift` — локальный каталог и ресурсы обоев.
- `native/Sources/UI/SimulatorEditorController.swift` — скрытый редактор и системный выбор фото.
- `native/Sources/UI/SimulatorWallpaperBootstrap.swift` — заполнение векторного кэша обоев до создания публичного UI.
- `native/scripts/prepare.py` — pin + точный patch + overlay исходников/ресурсов.
- `native/scripts/build.py` — оригинальная сборочная система Telegram, не Expo/EAS.
- `native/configuration.simulator.json` — фактически используется также unsigned device-сборкой; bundle ID `org.chatstudio.localsimulator`, URL scheme `localsimulator`, iCloud/Siri выключены.

Документ: `<app data container>/Library/Application Support/TelegramSimulator/document-v1.json`. Производный Postbox, AccountManager, оформление и медиа находятся отдельно в выбранном контейнере. Формат JSON v1 сохранять. **JSON-экспорт не включает обои и фоновые фотографии.**

## 4. С чего начать диагностику — гипотезы, не готовый диагноз

### A. Ранняя настройка Passcode/Keychain до fallback контейнера

В подготовленном `submodules/TelegramUI/Sources/AppDelegate.swift` примерно строки 573–577 остаётся:

```swift
try! PasscodeEnvironment.shared.configure(
    PasscodeConfiguration(appGroupIdentifier: appGroupName,
                          processRole: .mainApp,
                          biometricKeychainService: walletBiometricKeychainService),
    privateAccessGroup: { BuildConfig.keychainAccessGroup(baseAppBundleId: baseAppBundleId) }
)
let maybeAppGroupUrl = SimulatorUIConfiguration.applicationContainer(
    appGroupURL: FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupName),
    localMode: TelegramSimulator.enabled
)
```

Fallback ниже возвращает `NSHomeDirectory()` в локальном режиме. **Это не доказывает независимость всей ранней инициализации от App Groups/Keychain**, потому что `PasscodeEnvironment.configure` вызывается раньше и всё ещё получает исходный appGroupName и вычисляемую Keychain-группу. Аргумент `containerURL(...)` в текущем вызове всё равно вычисляется до входа в helper; возврат собственного URL не убирает сам этот вызов. После переподписи Team ID / access groups могли измениться. Проверить реализацию configure, её файловые URL, статусы SecItem и ошибки. Не утверждать, что это причина, пока нет лога/воспроизведения.

BuildConfig в upstream: `submodules/BuildConfig/Sources/BuildConfig.m`, заголовок `submodules/BuildConfig/PublicHeaders/BuildConfig/BuildConfig.h`. Где определён PasscodeEnvironment, найти по **полному** исходнику/зависимостям. Локальный checkout sparse: отсутствие файла в рабочей папке не означает отсутствия в upstream.

### B. Подпись и реальные entitlements установленной версии

Нужны точные настройки Sideloadly/SideStore, версия приложения после установки, логи подписи и установки. На Mac проверить `codesign -d --entitlements :-` для подписанной .app и `security cms -D -i embedded.mobileprovision`; сопоставить application-identifier, keychain-access-groups, Team ID, CFBundleIdentifier и необходимые возможности. Отсутствие расширений не доказывает совместимость всего upstream с бесплатной переподписью. Отсутствие provisioning в нашем исходном unsigned IPA ожидаемо; важен результат переподписи.

Не просить присылать Apple ID пароль, коды 2FA, приватные ключи или сертификаты с ключами. Не объявлять Sideloadly виноватым без фактов. Белый экран также не доказывает, что вся подпись корректна.

### C. Чистый первый запуск и цепочка локального аккаунта

Build 12/Simulator 22 функционально проверялся в QA #30/#31 с **заранее записанным синтетическим документом** через `seed_demo.py`. Это не эквивалент первого запуска пустого контейнера на телефоне. Исторический сценарий fresh проходил на более ранней версии; не приписывать его build 12.

Проверить:

1. Вход в AppDelegate, вычисление bundle/group/keychain IDs, Passcode configure, контейнер, ключи/открытие AccountManager и Postbox.
2. `TelegramSimulator.prepareAccount` (`TelegramSimulator.swift` около строки 55): транзакция выбирает/создаёт record, задаёт localization и removeAuth.
3. AppDelegate около строки 1130: `simulatorAccountReady |> mapToSignal { currentPresentationDataAndSettings(...) }`. Убедиться, что ожидаемые `next` действительно приходят, а completion без next или `.never()` не оставляют белый UI.
4. Изменения `TelegramCore/Sources/Account.swift` в patch: локальное AuthorizedAccountState, `initialize`, `project(account:)`, создание Account/SharedAccountContext.
5. Первое создание/загрузка document-v1.json. В `TelegramSimulatorWorkspace` ошибка репозитория сохраняется в loadError и snapshot может вернуть пустой документ; проверить, как ошибка доступна до открытия редактора.
6. Показ корневого TelegramRootController и его view. Лишь после него проверять wallpaper bootstrap и конкретные публичные экраны.

Добавить различимые локальные лог-маркеры по стадиям и ошибки, без телефонных номеров, содержимого переписок, токенов и ключей. Проверять реальный код готовой ревизии, а не угадывать API. Не заменять всю цепочку искусственным UIView ради видимости успеха. Если добавляется диагностический экран ошибки, он должен сопровождать исправление и диагностику, не скрывать причину.

### D. Другие ветви при наличии подтверждений

При crash/termination: стек, exception/signal, dyld, code signing, watchdog, jetsam. При живом процессе: незавершённый signal, блокировка main thread, ошибки файлового доступа/шифрования/Keychain, восстановление данных, не показанный window/root controller. Успешная компиляция/проверка arm64 не диагностирует эти случаи.

## 5. Что запросить у пользователя и как проверять

Минимум: фактическая модель и точная iOS; чем/какой версией установлен IPA; использованный файл/build; новая установка или обновление; сколько ждёт на белом экране; остаётся ли процесс активным или приложение возвращается на рабочий стол. Запросить лог установки/подписи и диагностический лог запуска. В системной аналитике iPhone искать отчёты Telegram/termination на момент запуска; при доступе к Mac использовать device console/логи. Конкретные утилиты для Windows выбирать по актуальным официальным сведениям, не обещать, что crash-log collector даст полный live log.

**Не удалять приложение и его данные вслепую.** Сначала выяснить, есть ли важные переписки/экспорт; чистую установку делать после согласования или на отдельном тестовом устройстве/bundle. Не трогать контейнер установленного настоящего Telegram. В QA удаляются/создаются только явно выделенные синтетические устройства.

Нужны отдельные проверки:

- Чистый пустой контейнер Simulator на новом бинарнике, без `seed_demo.py`.
- Синтетический заполненный контейнер и прежний функциональный сценарий.
- **Физический iPhone**, установленный тем способом подписи, которым пользуется клиент: первый запуск, фон/возврат, перезапуск, клавиатура, Photos, редактирование/сохранение. Не подменять эту проверку запуском Simulator executable.

## 6. Согласованный функционал — сохранить при исправлении

- Светлый оригинальный Telegram iOS UI: список с аватаром/именем/превью/временем/непрочитанными; личный текстовый диалог с датами/временем/одной-двумя галочками.
- Собеседник «в сети», «был(а) недавно», нативное «печатает» с анимацией.
- Публичная карточка: аватар, имя, фамилия, username, «О себе», произвольный номер, введённый вручную.
- Скрытый редактор открывается удержанием верхней центральной области 1,2 с. Распознаватель допускает x 25–75% ширины, y от safe-area top до top+64. В QA используется точка 27%,6%. В обычном UI административных кнопок нет.
- Собственный профиль и виртуальные собеседники с фото; создание личных чатов; сообщения от обеих сторон; правка текста/даты/времени/галочек/статуса/телефона; локальное сохранение, JSON backup.
- Публичная отправка очищает composer, публичная правка сохраняется и в документе после перезапуска. Сохранить correlationId в OutgoingMessageInfoAttribute, не откатывать исправление.
- Меню выделения/контекстное меню без навязчивой обучающей подсказки. Настоящий выбор текста сохранён.
- Итоговая нижняя вкладка настроек — **шестерёнка**, `defaultSettingsTabAvatar = false`; собственное фото отображается внутри настроек. Отдельной нижней лупы нет. Не перепутать со старым avatar-вариантом build 7.
- Истории — декоративный элемент для внешнего сходства, публикации/просмотра реальных историй нет. Настоящие звонки, группы/каналы, сервер/синхронизация не требуются.
- В этой же поставке стандартный узор и локальная смена общих обоев через «Настройки → Оформление → Обои для чатов», сохранение/сброс.
- Фото как обои и персональные обои чата имеют локальные hooks в исходниках, но отдельно через UI ещё не проверены. Не писать, что проверены.

## 7. Обои — уже исправлено, не сломать повторно

Используется **полный оригинальный** `fqv01SQemVIBAAAApND8LDRUhRU.tgv`, 183832 байта, SHA256 `3c5ef666d033ce9effe703b80348b9d7363323f0076b2856ec041923c78b0ab8`; исходный SVG viewBox 0 0 1440 2960. Файл есть в полном upstream. Ранний вывод, что есть только миниатюра, был ошибкой из-за sparse checkout.

`native/Resources/SimulatorDefaultPattern.bin` — подготовленные векторные команды pinned NanoSVG/CGContextCoder, **не растянутая картинка**. 498438 байт, SHA256 `96071caea6918689bc93261ae9e570b9f4665f5908d33b9c3d7fdf4b994ffbde`. Bootstrap кладёт кэш `prepared-pattern-wallpaper` в account/shared media box до публичного UI через TelegramEngine. Рендерер Telegram не переписан. Если убрать кэш, в чате раньше оставался только градиент.

Проверяющий скрипт `verify_wallpaper_bundle.py` учитывает преобразование PNG Xcode в CgBI: сравнивать только исходные/скомпилированные PNG-хеши напрямую нельзя. Точные TGV/BIN и ресурсы проверены в обоих IPA; пять проверок реальных кадров подтвердили рисунок, синий вариант после правки и перезапуска, возврат зелёного после сброса. `CachedUserData` при проекции сообщений/профилей сохраняется, поэтому обои не теряются.

## 8. Что действительно проверено до обращения с телефона

- Device build 12 и Simulator build 22 успешно собраны из одного SHA.
- Device ZIP CRC/SHA, основной executable + пять framework arm64/IOS, обязательные зависимости, photo permission, скомпилированный gear=false avatar flag, точные ресурсы. **Это статические проверки, не подписанный запуск на телефоне.**
- QA #30: https://github.com/razievdaniil-rgb/telegram_visual_copy/actions/runs/40792297773 — меню/обои успешны, потом timeout импорта тестового фото. Не выдавать весь workflow за success.
- QA #31: https://github.com/razievdaniil-rgb/telegram_visual_copy/actions/runs/40795917058 — success: Photos init, оба аватара (85 команд), полный функциональный сценарий (172 команды), проверка правки в документе после перезапуска.
- На QA использовался iPhone 13 Pro Max Simulator / iOS 27.0, Xcode 27.1 на macOS 27.0.1. Просмотрены 57 контрольных снимков и стыки монтажа; ролик CFR/faststart полностью декодирован.
- 14 переносимых Swift-тестов модели, синтаксический разбор и применение/обратимость точного patch 26 файлов; TypeScript/lint. Эти проверки не заменяют device runtime. Expo-проверки относятся к архиву.
- Попиксельное сравнение всех экранов с App Store Telegram не завершалось.

Отчёты: `docs/IPHONE_CLIENT_BUILD.md`, `docs/FEATURE_VIDEO.md`, `docs/builds/native-client-device-preflight.json`, `native-client-device-settings-default.json`, `native-client-device-wallpaper-resources.json`, `native-client-simulator-wallpaper-resources.json`, `native-client-qa30-summary.json`, `native-client-qa31-summary.json`, `native-client-wallpaper-frames.json`, `native-client-final-video.json` в `docs/builds/`.

## 9. Как собирать без локального Mac

У пользователя Windows/PowerShell, локального Mac/Xcode нет. Использовался уже доступный GitHub Actions runner **xcode-27**, `DEVELOPER_DIR=/Applications/Xcode_27.1.app/Contents/Developer`. Upstream pin требует macOS 27, Xcode 27.1, Bazel 9.2.0. Не понижать версии по памяти и не обещать компиляцию оригинального iOS на Windows.

- `.github/workflows/native-build.yml`: device IPA. Триггер workflow_dispatch либо изменение `native/cloud-build-request.json` (сейчас attempt 12). Изменение самого native-build.yml тоже запускает сборку, поэтому не править его случайно.
- `.github/workflows/native-compile.yml`: Simulator; запрос `native/compile-request.json` (сейчас attempt 22). Файла simulator-build-request.json нет.
- `.github/workflows/native-qa.yml`: загрузка уже готового Simulator artifact, установка в выделенный синтетический Simulator, Maestro 2.11.0 и настоящая запись simctl. Запрос `native/qa-request.json` с app_run_id. QA не требует пересборки, если код не менялся; после изменения приложения нужен новый app_run_id.
- `.github/workflows/native-source.yml`: переносимые source/model проверки отдельно от полной компиляции.

Подготовка/проверка (не сборка на Windows):

```text
python native/scripts/prepare.py --checkout artifacts/telegram-ios-source --check
python native/scripts/test_preparation.py --checkout artifacts/telegram-ios-source
python native/scripts/validate_qa.py
```

Новый полный checkout получается через `python native/scripts/prepare.py --full`; исходники/рекурсивные зависимости большие. Подготовленный локальный checkout `artifacts/telegram-ios-source` sparse, а по умолчанию prepare/build используют `artifacts/native-telegram-ios`. **Всегда передавать один и тот же --checkout**, не путать эти папки. Не применять patch повторно поверх другого pin/конфликтующих изменений.

На Mac после полной подготовки:

```text
python3 native/scripts/build.py build-unsigned-device --checkout <prepared checkout> --build-number <new number>
python3 native/scripts/build.py build-simulator --checkout <prepared checkout> --build-number <new number>
swift test --package-path native
```

Wrapper использует оригинальный `build-system/Make/Make.py`: unsigned device — debug_arm64 с `--localUnsignedBuild --simulatorLocalMode`, Simulator — debug_sim_arm64; расширения отключены. SwiftPM тестирует модель, **не собирает Telegram.app**. Полный оригинальный target собирать через Make.py, не отдельные UI targets в обход сборочной системы.

Холодная сборка некоторых модулей занимала десятки минут; восстановление Bazel cache не гарантирует мгновенный build. Полные job logs через GitHub API доступны после завершения, живой журнал — через авторизованный браузер. Не гарантировать успех до результата. Артефакты CI — временные; скачать проверенный новый IPA локально.

## 10. Правила изменения исходников и история

1. Прочитать корневой AGENTS.md и инструкции AGENTS.md/CLAUDE.md подготовленного upstream. Сохранить публичные оригинальные компоненты.
2. Источник правок — `native/Sources` и точный patch, а не только ignored checkout: иначе изменения не попадут в облачную сборку. Проверять подготовленный результат и round trip.
3. **Не добавлять новые прямые обращения `.postbox` / import Postbox в UI-модули.** Upstream PostboxImportCheck это запрещает. Для новых UI helpers использовать существующие TelegramEngine API; не расширять allowlist ради обхода. Так уже падала попытка build 11.
4. Не путать simulator/device архитектуру и не обещать установку простым открытием IPA в Telegram. Оригинальный IPA без provisioning/подписи рассчитан на последующую подпись.
5. Осторожно с CRLF: одна неудачная регенерация дала огромный diff вместо точного 26-файлового patch. Сохранять `core.autocrlf=true`, diff только по уже затронутым путям и нужным новым точкам. Проверять отсутствие посторонних/целофайловых newline diff, затем `test_preparation.py`.
6. Sparse checkout/promisor может требовать сеть для git show. Не интерпретировать отсутствие локального blob/ошибку DNS как отсутствие исходного ресурса.
7. Сохранять отдельные осмысленные коммиты, push проверенных этапов, не squash/reset чужой истории и не стирать неизвестные изменения. Перед началом проверить git status.
8. Рабочие временные материалы в ignored `artifacts/`. В секреты/credentials не лезть и не публиковать их.
9. После исправления обновить docs/STATUS.md с причиной, доказательствами и оставшимися ограничениями. Прежний статус «IPA и видео готовы» относился к сборке и Simulator; пользователь теперь сообщил реальный сбой на телефоне.

## 11. Критерий завершения следующего этапа

Не просто убрать белый фон: установить конкретную причину, внести воспроизводимое исправление, получить новый device IPA, подписать/установить выбранным способом и **подтвердить запуск на физическом iPhone**. Затем проверить пустой и заполненный сценарии, редактор, оба аватара, сообщения/правки/время/статусы/обои и сохранение. Отдать один итоговый IPA с правильным build/SHA, обновлённую PDF-инструкцию и краткий отчёт, что проверено на телефоне, а что ещё нет. Если устройство/лог недоступны, явно назвать это ограничение; не выдавать предположение за установленную причину и не обещать, что Simulator гарантирует работу на iPhone.
