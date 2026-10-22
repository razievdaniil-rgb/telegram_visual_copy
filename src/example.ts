import { emptyDocument, type Document } from './model';
export function exampleDocument(): Document {
  const state = emptyDocument();
  const now = new Date();
  const at = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();
  return {
    ...state,
    profiles: [
      {
        id: 'example-anna',
        firstName: 'Анна',
        lastName: 'Миронова',
        username: 'anna_example',
        phone: '+7 000 000-00-01',
        bio: 'Демонстрационный профиль',
        avatar: null,
        color: '#61B6A5',
      },
      {
        id: 'example-max',
        firstName: 'Максим',
        lastName: 'Волков',
        username: 'max_example',
        phone: '+7 000 000-00-02',
        bio: 'Демонстрационный профиль',
        avatar: null,
        color: '#729DD8',
      },
    ],
    chats: [
      {
        id: 'example-chat-anna',
        profileId: 'example-anna',
        unread: 2,
        presence: 'online',
        createdAt: at(1440),
      },
      {
        id: 'example-chat-max',
        profileId: 'example-max',
        unread: 0,
        presence: 'recently',
        createdAt: at(1440),
      },
    ],
    messages: [
      {
        id: 'example-1',
        chatId: 'example-chat-anna',
        direction: 'incoming',
        text: 'Привет! Во сколько завтра встречаемся?',
        sentAt: at(15),
        receipt: 'read',
        edited: false,
      },
      {
        id: 'example-2',
        chatId: 'example-chat-anna',
        direction: 'outgoing',
        text: 'Давай в 12:00, в том же месте 🙂',
        sentAt: at(13),
        receipt: 'read',
        edited: false,
      },
      {
        id: 'example-3',
        chatId: 'example-chat-anna',
        direction: 'incoming',
        text: 'Отлично, до встречи!',
        sentAt: at(10),
        receipt: 'read',
        edited: false,
      },
      {
        id: 'example-4',
        chatId: 'example-chat-max',
        direction: 'incoming',
        text: 'Как продвигается проект?',
        sentAt: at(80),
        receipt: 'read',
        edited: false,
      },
      {
        id: 'example-5',
        chatId: 'example-chat-max',
        direction: 'outgoing',
        text: 'Покажу вечером, почти всё готово',
        sentAt: at(65),
        receipt: 'sent',
        edited: false,
      },
    ],
  };
}
