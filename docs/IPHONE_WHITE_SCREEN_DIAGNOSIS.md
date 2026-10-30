# Белый экран на физическом iPhone — разбор и исправление

Обновлено 30 октября 2026. Продолжение [передачи](CLAUDE_HANDOFF_IPHONE_WHITE_SCREEN.md).

## 1. Что именно показывает белый экран

Белая поверхность с системным индикатором Home — это не отдельный экран ошибки, а штатное состояние запуска Telegram iOS до появления интерфейса:

- `submodules/TelegramUI/Sources/AppDelegate.swift` при создании окна задаёт `hostView.containerView.backgroundColor = UIColor.white` для светлого оформления;
- `self.window?.makeKeyAndVisible()` выполняется в `scene(_:willConnectTo:options:)`, то есть окно показывается ещё без содержимого;
- `self.mainWindow.viewController = context.rootController` выполняется только внутри `context.isReady.get() |> filter { $0 } |> take(1)`, где `isReady` для `AuthorizedApplicationContext` — это `combineLatest(tabsController.ready, selectedController.ready)`;
- до этого моментa `UILaunchStoryboardName = LaunchScreen` (`Base.lproj/LaunchScreen.nib`, 931 байт) тоже белый.

Следствие: по одному кадру нельзя отличить «ещё не дошли до интерфейса» от «launch screen всё ещё на экране». Но оба случая означают одно — **процесс жив и запуск не завершён**, а не ошибку загрузки образа.

## 2. Что исключено по самому переданному файлу

Проверено непосредственно в `Telegram-client.ipa` (SHA256 `4303cd192001efdef8eaabab7f8e3c8dd2dc6ecbbd7fdb571e5780d4bee07789`, 609 032 044 байта):

| Проверка | Результат |
| --- | --- |
| `Payload/Telegram.app/Telegram`, Mach-O | `MH_EXECUTE`, `LC_BUILD_VERSION platform=IOS minos=15.0 sdk=27.1` |
| `TelegramUIFramework` | `MH_DYLIB`, `platform=IOS minos=15.0 sdk=27.1`, `LC_ID_DYLIB @rpath/...` |
| `LC_RPATH` основного бинарника | `/usr/lib/swift`, `@executable_path/Frameworks` |
| Зависимости | пять `@rpath/*Framework.framework/*` присутствуют в пакете |
| `Info.plist` | `CFBundleIdentifier org.chatstudio.localsimulator`, `CFBundleVersion 12`, `MinimumOSVersion 15.0`, `UIRequiredDeviceCapabilities [arm64]` |
| Подпись | `LC_CODE_SIGNATURE` отсутствует (ожидаемо для unsigned-пакета, подпись добавляется при установке) |

То есть несовместимость платформы, минимальной версии iOS, архитектуры или путей загрузки framework как причина не подходит. Ошибка подписи/dyld тоже не подходит по поведению: приложение остаётся на экране, а не закрывается сразу.

Отдельно просмотрена вся цепочка запуска локального режима в подготовленном checkout: `PasscodeEnvironment.configure` (гипотеза A передачи) проверяет только префикс `group.` у идентификатора и не обращается ни к файловой системе, ни к Keychain, поэтому `try!` там не срабатывает; `SimulatorUIConfiguration.applicationContainer` корректно подменяет контейнер на `NSHomeDirectory()`; `BuildConfig.deviceSpecificEncryptionParameters` работает через файл `.tempkey`, а не Keychain; все обращения `AccountManager` к Passcode-хранилищу обёрнуты в `try?`/`catch` и деградируют без блокировки запуска; `SimulatorRepository` на пустом контейнере создаёт документ по умолчанию без записи. На чистом первом запуске тупика в этой цепочке не найдено.

## 3. Установленный механизм отказа

`native/scripts/build.py` в режиме `build-unsigned-device` выбирал конфигурацию `debug_arm64`:

```python
variant = "debug_sim_arm64" if simulator else ("debug_arm64" if unsigned else "release_arm64")
```

«Без подписи» и «без оптимизации» были связаны в одной строке, хотя `--localUnsignedBuild` на конфигурацию не влияет. В `debug_arm64` (`build-system/Make/Make.py`, `-c dbg`) почти каждый submodule Telegram компилируется с `-Onone`; upstream отдельно фиксирует, что лишь два submodule переопределяют это через `copts = ["-O"]`, и приводит измеренный разрыв `-O`/`-Onone` в 3,4 мс против 1083 мс на одном пиксельном цикле. Результат виден в пакете:

- `TelegramUIFramework`: 485 788 368 байт, `__TEXT` 217,0 МБ, `__LINKEDIT` 234,8 МБ;
- `TelegramCoreFramework`: 78 777 312 байт;
- весь IPA: 609 МБ против обычных ~150–200 МБ для оптимизированной сборки.

Запуск такого образа на телефоне дополнительно платит за валидацию подписи каждой затронутой страницы при page fault, а неоптимизированный Swift затрагивает кода существенно больше.

Решающее отличие устройства от Simulator здесь не в скорости как таковой:

- установленное приложение запускается **без отладчика**, поэтому iOS применяет launch watchdog и завершает процесс, не уложившийся в отведённое время;
- **iOS Simulator launch watchdog не применяет** и работает на хосте Apple Silicon с тёплым файловым кэшем и без постраничной проверки подписи.

Поэтому Simulator-QA #30/#31 не могли обнаружить этот отказ в принципе, а не «пропустили» его.

## 4. Исправление

1. `build-unsigned-device` собирает `release_arm64` (`-c opt`, `-Osize`, `swift.opt_uses_wmo`, `dead_strip`, `--objc_enable_binary_stripping`) и остаётся без установочной подписи. Прежнее поведение доступно явным флагом `--unoptimized` и предназначено только для работы с подключённым отладчиком.
2. Для локальной unsigned-сборки из конфигурации убраны `--apple_generate_dsym` и `--output_groups=+dsyms`: в IPA dSYM не входят, а `dsymutil` над оптимизированным бинарником этого размера стоит минуты и десятки гигабайт на одноразовом runner.
3. `timeout-minutes` рабочего процесса поднят до 350: WMO медленнее прежней `-Onone` сборки, а кэш Bazel оптимизированных выходов пока не содержит.

Интерфейс, локальный редактор, обои и формат документа не менялись. К Expo/PWA проект не возвращался.

## 5. Диагностика, которая остаётся в сборке

Исправление сопровождается записью этапов, чтобы следующий запуск на телефоне давал факты, а не ещё одну догадку.

- `native/Sources/Core/SimulatorLaunchTrace.swift` — записывает каждый этап до перехода к следующему, поэтому файл содержит последний достигнутый этап и после завершения процесса системой. Файл: `Documents/TelegramSimulator/launch-trace.txt`, предыдущий запуск — `launch-trace-previous.txt`. Этапы: `window`, `container`, `storage`, `account-manager`, `prepare-account`, `account-record`, `presentation-data`, `shared-context`, `account-state`, `projection`, `projection-done`, `context`, `window-visible`, `interface-visible`. Последний этап — признак завершённого запуска; его отсутствие в предыдущей записи и есть диагностируемый случай.
- `UIFileSharingEnabled` включён, чтобы журнал можно было забрать с телефона через «Файлы → На iPhone → Telegram» без Mac. Открывается только папка `Documents`; документ редактора лежит в `Library/Application Support` и в неё не попадает.
- `native/Sources/UI/SimulatorLaunchDiagnostics.swift` — если интерфейс не появился за 8 с, показывает этапы поверх пустого окна и убирает себя, как только корневой контроллер установлен. При исправном запуске не появляется.

Записываются только фиксированные имена этапов и миллисекунды: ни текстов переписок, ни имён, ни номеров, ни токенов и ключей.

## 6. Что ещё не подтверждено

- **Запуск на физическом iPhone не проверен.** Устройства, Mac и логов с телефона в этой среде нет. Причина названа как механизм, установленный по артефактам и исходникам, а не как подтверждённый логом диагноз.
- `release_arm64` в этом проекте собирается впервые; прежние успешные сборки — `debug_arm64` и `debug_sim_arm64`.
- Simulator-QA остаётся на `debug_sim_arm64`, то есть QA и поставляемый IPA различаются уровнем оптимизации. Это осознанное расхождение: менять обе конфигурации сразу без возможности проверить ни одну — хуже.
- После подтверждения запуска на телефоне нужны: пустой и заполненный сценарии, редактор, оба аватара, сообщения/правки/время/статусы/обои, сохранение после перезапуска и PDF-инструкция.
- Отдельно отмечено для будущего: `PasscodeCore` использует app-group-идентификатор как Keychain access group (`PasscodeKeychain.query`), на которую переподписанная бесплатным Apple ID сборка прав не имеет, поэтому на телефоне эти обращения возвращают ошибку, а в Simulator access group не проверяется. Запуск это не блокирует — все вызовы обёрнуты в `try?`/`catch` — и в этом проходе код не менялся.
