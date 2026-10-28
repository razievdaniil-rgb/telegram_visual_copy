> Актуально на 28 октября 2026
>
> Этот ролик 2:45 относится к историческому бинарнику 211bcf2, до последних изменений аватара и удаления лупы. Текущий [iPhone build 7](IPHONE_BUILD7.md) проверен новыми сценариями и просмотром кадров; ролик не является демонстрацией этой IPA.

---

# Нативная демонстрация — 28 октября 2026

[Открыть / скачать MP4](https://raw.githubusercontent.com/razievdaniil-rgb/telegram_visual_copy/main/docs/videos/Telegram-native-menu-avatars.mp4), [файл в репозитории](videos/Telegram-native-menu-avatars.mp4). **2:45** (164.767 с), 5 624 395 байт, 720×1622, H.264 Main, постоянные 30 fps, без звука. Полностью декодированы **4943 кадра**, `moov` расположен перед `mdat` для начала воспроизведения без полной загрузки. SHA-256: `2cd8734c70df5679999d07d3817dda3cb63ace3c68333589980d0e119a4c48fe`.

Это настоящий нативный Telegram-форк **211bcf2**, установленный в iPhone 13 Pro Max Simulator / iOS 27.0. [Компиляция](https://github.com/razievdaniil-rgb/telegram_visual_copy/actions/runs/40662176361) и [QA #19](https://github.com/razievdaniil-rgb/telegram_visual_copy/actions/runs/40663813833) успешны. Меню, аватары и функциональный сценарий сняты последовательно на одном бинарнике и одном документе без переустановки. Кадры предыдущих сборок и Expo/PWA не используются.

- **00:00** — Главное меню, поиск и папки
- **00:20** — Замена аватара
- **00:46** — Сообщение и редактирование
- **01:16** — Профиль и новая переписка
- **01:32** — Дата, время и галочки
- **02:12** — Профиль и номер
- **02:34** — Статусы и сохранение
- **02:43** — После перезапуска

Показана именно **замена уже существующего аватара**: оранжевый → синий, выбор фото и подтверждение обрезки, сохранение, результат в списке и профиле, повторный профиль после перезапуска. Затем: набор и отправка, меню сообщения без обучающей карточки выделения, публичное редактирование, скрытый редактор, создание профиля/чата, сообщения за обе стороны, произвольные дата/часы/минуты, одна и две галочки, изменение номера, статусы и сохранение публичной правки после перезапуска.

Действия и сохранённые анимации идут в обычной скорости, без интерполяции. Сокращены технические ожидания; часть повторного заполнения форм и переходов пропущена. Верхняя подпись главы расположена вне изображения приложения. Исходные три VFR-записи не изменены; [артефакты QA](https://github.com/razievdaniil-rgb/telegram_visual_copy/actions/runs/40663813833) содержат записи, снимки и журналы (срок хранения ограничен). Полный проход функций подтверждён отдельно от монтажа. В оригинальном интерфейсе остаётся первичная подсказка микрофона в некоторых состояниях аккаунта; это не подсказка выделения сообщения.

Просмотрены снимки всех трёх сценариев, последовательности кадров движения меню, кадры экспортированных глав и стыки итогового ролика. [Параметры, происхождение и ограничения](builds/native-menu-avatar-video.json), [проверка меню](MAIN_MENU_REVIEW.md), [функциональная проверка](NATIVE_REQUIREMENTS_QA.md).

## Повторение монтажа

Распаковать full QA в `artifacts/menu-update/qa19`, menu в `artifacts/menu-update/qa19-menu`, avatar в `artifacts/menu-update/qa19-avatar`. Создать папку `artifacts/menu-update/final19`. Исходные пути и SHA проверяются планами. Сохранённые планы и отчёты: `docs/builds/native-{menu,avatar,body}-video-{plan,edit}.json`.

```powershell
python scripts/render-calm-demo.py docs/builds/native-menu-video-plan.json artifacts/menu-update/final19/menu-v2.mp4
python scripts/render-calm-demo.py docs/builds/native-avatar-video-plan.json artifacts/menu-update/final19/avatar.mp4
python scripts/render-calm-demo.py docs/builds/native-body-video-plan.json artifacts/menu-update/final19/body-v2.mp4
python scripts/combine-native-demo.py docs/builds/native-menu-avatar-combine-plan.json artifacts/menu-update/Telegram-native-menu-avatars.mp4
```

Физический iPhone, подпись и установка текущей версии ещё не проверены. Simulator IPA не предназначен для установки на телефон. Ролик не подтверждает полное попиксельное совпадение и реальные задержки на устройстве.

Предыдущий ролик 27 октября: [архив 4ae3913, 2:43](videos/Telegram-native-demo.mp4).
