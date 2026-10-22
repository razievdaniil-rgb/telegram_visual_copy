import { router } from 'expo-router';
export const openEditor = (chatId?: string) =>
  router.push({ pathname: '/editor', params: chatId ? { chatId } : {} });
export const openChat = (id: string) => router.push({ pathname: '/chat/[id]', params: { id } });
export const goBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};
