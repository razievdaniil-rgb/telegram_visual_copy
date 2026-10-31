# Оригинальный интерфейс и точки локальной интеграции

Все пути ниже — относительно подготовленного checkout Telegram iOS `fb0e62ba`. Экраны не перенесены в React Native и не воспроизведены новыми SwiftUI-макетами: используются исходные классы.

| Экран / слой | Оригинальный код | Наша доработка |
|---|---|---|
| Запуск | `submodules/TelegramUI/Sources/AppDelegate.swift`, `ApplicationContext.swift` | Создать локальную запись аккаунта до построения контекста; не показывать стартовые запросы разрешений контактов/уведомлений |
| Готовность локальных данных | `TelegramCore/Sources/State/AccountStateManager.swift`, `TelegramUI/Sources/ChatHistoryViewForLocation.swift` | Начинать локальный аккаунт без незавершённой синхронизации; сохранять `CachedUserData.businessIntro` как известное отсутствие, чтобы история не ждала отключённый сервер |
| Навигация и вкладки | `submodules/TelegramUI/Sources/TelegramRootController.swift` | Невидимый долгий жест в центральной области заголовка; показ отдельного UIKit-редактора |
| Список чатов | `submodules/ChatListUI/Sources/ChatListController.swift`, `Node/ChatListItem.swift` | Список получает оригинальные Postbox-записи; ручная галочка последнего сообщения применяется в существующем отображении |
| Диалог | `submodules/TelegramUI/Sources/ChatController.swift` | Сам экран оставлен оригинальным; операции перенаправлены ниже, в TelegramCore |
| Текст, пузыри, переносы | `submodules/TelegramUI/Components/Chat/ChatMessageTextBubbleContentNode`, `ChatMessageBubbleItemNode`, `ChatMessageItemImpl` | Геометрия, шрифты и измерение текста не переписаны; ручные галочки подключены в item/content |
| Ввод текста и клавиатура | `submodules/TelegramUI/Components/Chat/ChatTextInputPanelNode` | Поле оригинальное; `enqueueMessages` записывает локальное сообщение вместо сетевой очереди |
| Статус и «печатает» | `submodules/TelegramUI/Components/ChatTitleView`, `TelegramCore/Sources/Account/Account.swift` | Нативные потоки activity получают ручной статус, обновляются при сохранении документа |
| Профиль и настройки | `submodules/TelegramUI/Components/PeerInfo/PeerInfoScreen` | Оригинальные представления получают `TelegramUser`, `CachedUserData`, локальные avatar resources |
| Правка профиля | `TelegramEngine/AccountData/UpdateAccountPeerName.swift`, `TelegramEngine/Contacts/UpdateContactName.swift` | Имя, фамилия и «О себе» пишутся в документ и проецируются: оригинальный экран сохраняет свой модальный индикатор, но тот закрывается, а не ждёт отключённый сервер. Ограничения полей, которые онлайн накладывает сервер, применяются до записи |
| Аккаунт и хранилище | `submodules/TelegramCore/Sources/Account/Account.swift`, Postbox | Локальное `AuthorizedAccountState`, без настоящего SMS-входа; JSON → транзакционная проекция Postbox |
| Отправка/изменение/удаление | `PendingMessages/EnqueueMessage.swift`, `RequestEditMessage.swift`, `TelegramEngine/Messages/DeleteMessagesInteractively.swift`, `TelegramUI/Sources/Chat/ChatControllerLoadDisplayNode.swift` | Локальный документ и проекция; публичное редактирование перехватывается также перед PendingUpdateMessageManager. Correlation ID исходящего сохраняется для штатной анимации отправки и очистки поля |
| Сетевой транспорт | `submodules/TelegramCore/Sources/Network/Network.swift` | Основная сессия приостановлена, network access выключен, worker не создаётся, запросы не отправляются; нужны проверки трафика на реальном запуске |
| Сборка | `build-system/Make/Make.py` | Флаг локального режима отключает расширения, для симулятора — provisioning; APNs-профиль не требуется |

`SimulatorFieldRules` — единственное место с ограничениями полей: длина и допустимые символы имени, фамилии, username, телефона, «О себе» и текста сообщения, плюс предел счётчика непрочитанных. Скрытый редактор применяет их при вводе и называет поле при сохранении; публичные экраны не меняются, но запись в документ проходит те же ограничения. `SimulatorDocument.validated()` намеренно оставлен прежним, чтобы документ, созданный до этих правил, продолжал открываться.

Новые файлы копируются в `TelegramCore/Sources/LocalSimulator` и `TelegramUI/Sources/LocalSimulator`. Оба upstream BUILD используют glob `Sources/**/*.swift`; отдельного нового iOS-target или Expo-модуля не добавлено.

## Поток данных

Редактор / публичная отправка → проверка документа версии 1 → атомарная запись JSON → транзакция Postbox → существующие подписки и оригинальные экраны.

При неудачной записи JSON модель в памяти не заменяется. При следующем запуске Postbox восстанавливается из последнего сохранённого документа. Публичные профильные/сетевые операции, не входящие в локальные функции, ещё нужно проверить отдельно; сохранение исходного вида кнопки не означает реализацию её сетевой функции.

## Проверка внешнего вида

Первая проверка на Mac: оригинальная сборка той же ревизии и наш форк, одинаковое устройство/система/размер текста/локализация. Сверить список, короткий и многострочный текст, группировку, даты, галочки, профиль, клавиатуру и переходы. До записи симулятора и сравнения кадров визуальное совпадение не подтверждено. Исходный интерфейс выбран как основа, но это не заменяет проверку интеграции.

## Главное меню — 28 октября

`ChatListController` включает `updateTabBarSearchState` и штатную доступность кнопки историй, ограничивает открытие медиаисторий локальным уведомлением. `ChatListControllerNode` скрывает верхний placeholder только у корневого локального списка с нижним поиском. `TelegramEngineMessages.storySubscriptions` получает локальное превью из `TelegramSimulator.storySubscriptions`; медиа и сетевых историй нет. Инициализация папок записывает стандартный `ChatListFiltersState` один раз и не переписывает последующие настройки. Внешний вид рисуют оригинальные ChatListNavigationBar, StoryPeerListComponent, HorizontalTabs и TabBarComponent.

Для корневого нижнего поиска `ChatListContainerItemNode.scrollHeightTopInset = 0`: искусственная минимальная высота не даёт короткому списку уйти под неподвижный заголовок. Начальное/доводочное смещение исключает отсутствующий верхний поисковый ряд. Исходное раскрытие через отрицательный `tempTopInset` сохранено. QA #19 проверяет четыре возвращённых состояния по снимкам.

## Уточнения клиента для iPhone

`SimulatorUIConfiguration` задаёт default аватара вкладки настроек и QA-переопределение. Оригинальный `PeerInfoScreen` выбирает тот же `accountTabBarAvatar`, `peerAvatarImage` и кольцо выбора; при выключении используется исходная иконка Settings. `simulatorUsesCompactHeader` сохраняет компактную геометрию ChatList, но больше не включает `updateTabBarSearchState`, поэтому отдельной нижней лупы нет. AppDelegate берёт приватный контейнер только в локальном режиме без расширений; онлайн-ветвь сохраняет исходный App Groups.
