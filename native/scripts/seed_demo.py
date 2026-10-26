#!/usr/bin/env python3
"""Seed only the data container of a newly created, dedicated CI simulator."""
import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path


def fixture():
    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    def stamp(minutes):
        return (now + timedelta(minutes=minutes)).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    def profile(identifier, first, last="", bio=""):
        return dict(id=identifier, firstName=first, lastName=last, username="", phone="", bio=bio, avatar=None, color="#5F9BE5")
    messages = [
        ("incoming", "Привет! Как продвигается приложение?", -9),
        ("outgoing", "Привет! Уже можно посмотреть интерфейс и переписки.", -8),
        ("incoming", "А длинные сообщения тоже отображаются правильно? Хочется увидеть переносы строк и время внутри пузыря.", -7),
        ("outgoing", "Да, это оригинальные компоненты Telegram для iOS.\nМожно писать и в несколько строк 🙂", -6),
        ("incoming", "Отлично, покажи ещё профиль и редактор", -5),
    ]
    return dict(version=1, self=profile("self", "Даниил", bio="Демонстрационный профиль"),
        profiles=[profile("demo-anna", "Анна", "Миронова", "Виртуальный собеседник для демонстрации"), profile("demo-mikhail", "Михаил")],
        chats=[dict(id="demo-chat", profileId="demo-anna", presence="online", unread=1, createdAt=stamp(-60)),
               dict(id="demo-chat-2", profileId="demo-mikhail", presence="recently", unread=0, createdAt=stamp(-60))],
        messages=[dict(id=f"demo-{i}", chatId="demo-chat", text=text, direction=side, sentAt=stamp(minutes), receipt="read", edited=False)
                  for i, (side, text, minutes) in enumerate(messages)] + [dict(id="demo-other", chatId="demo-chat-2", text="Договорились, до завтра!", direction="incoming", sentAt=stamp(-40), receipt="read", edited=False)])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("container", type=Path)
    args = parser.parse_args()
    path = args.container / "Library/Application Support/TelegramSimulator/document-v1.json"
    if path.exists():
        raise SystemExit("Refusing to overwrite an existing document; use a fresh demo simulator")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(fixture(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(path)
