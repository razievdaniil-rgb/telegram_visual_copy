# Перенос текста и пузырей из Telegram iOS 13.1.1

Исходники зафиксированы на `fb0e62ba8a147f0821da6aa63c09da7d79a10111`.

| Исходник Telegram                                                                                                           | Адаптация в проекте                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submodules/Display/Source/Font.swift`                                                                                      | `src/theme.ts`: iOS `System`, штатный kerning вместо явного `letterSpacing: 0`                                                                                                           |
| `submodules/TelegramPresentationData/Sources/ChatPresentationData.swift:56`                                                 | Сообщение: `Font.regular(baseFontSize)`, стандартный размер 17                                                                                                                           |
| `submodules/Display/Source/TextNode.swift:1790`                                                                             | Измерение текста без времени, обычный последовательный перенос. SF17: высота строки 20, промежуток 2                                                                                     |
| `submodules/TelegramUI/Components/Chat/ChatMessageTextBubbleContentNode/Sources/ChatMessageTextBubbleContentNode.swift:659` | `src/text-measure*`, `src/message-content.tsx`: полная доступная ширина текста, ширина последней строки отдельно                                                                         |
| `submodules/TelegramUI/Components/Chat/ChatMessageDateAndStatusNode/Sources/ChatMessageDateAndStatusNode.swift:1011`        | `src/message-geometry.ts`: время рядом с последней строкой, если помещается; иначе отдельный нижний ряд. Время не участвует в переносе текста                                            |
| `submodules/TelegramPresentationData/Sources/ChatMessageBubbleImages.swift:82`                                              | `src/message-bubble.tsx`: исходные кривые хвостика, радиусы 16/8, отражение входящего пузыря                                                                                             |
| `submodules/TelegramUI/Components/Chat/ChatMessageItemCommon/Sources/ChatMessageItemCommon.swift:138`                       | Отступы 11 + 6 для хвоста; вертикальные 6±физический пиксель; максимальный fill: экран−36 / 85%; BubbleItemNode затем вычитает 15pt и добавляет 6pt хвоста (итог 357pt при экране 402pt) |

Swift-компоненты используют UIKit, CoreText и AsyncDisplayKit. В React Native перенесена их последовательность измерения, а не попытка импортировать несовместимые Swift-классы в JavaScript. На native измеряет `onTextLayout`; web использует реальные прямоугольники строк DOM (React Native Web не реализует `onTextLayout`).

Удалён старый прозрачный суффикс с неразрывными пробелами, который резервировал место даты внутри текста. У Android отключена балансировка строк (`simple`), у iOS — дополнительная стратегия переноса (`none`). Проверки алгоритма покрывают короткую последнюю строку, заполненную строку, короткий ответ, RTL и длинное слово.

Ограничение шрифта: Telegram iOS получает SF через `UIFont.systemFont`, отдельного SF-файла в этом исходном коде нет. iOS использует тот же системный путь; Windows и Android пока имеют платформенный fallback. Файлы `iostgico` — только пиктограммы. Называть fallback идентичным SF нельзя. Новые нативные снимки и их происхождение сохранены в TELEGRAM_13_QA.md. Сравнения с эталонным Telegram 13.1.1 по пикселям ещё нет.

## Поле ввода

Нативный снимок 40085951816 показал: значение уже содержит две строки, но UITextView остаётся высотой 21pt. Проверка видимости текста в accessibility-дереве это не обнаружила. Высота поля теперь определяется тем же измерителем строк при фактической ширине TextInput; старый onContentSizeChange убран. Высота текстовой области ограничена 21–130pt, после 130pt включается прокрутка; минимальная высота всей капсулы — 40pt. Пустая строка после Enter учитывается только в невидимом измерителе; данные сообщения не меняются. Проверка: отдельный сценарий `.maestro/composer.yaml`.

## Получение SF

Проверена [официальная страница Apple Fonts](https://developer.apple.com/fonts/), раздел лицензии 2.B: встраивание Apple Font в программы не разрешено. Поэтому SF не добавлен в публичный репозиторий, Android-сборку или web-font. На iOS используется системный шрифт. На Windows/Android сохраняется платформенная замена; точное совпадение этих платформ по шрифту не заявляется.
