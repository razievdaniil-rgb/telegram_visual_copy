import { Platform } from 'react-native';

// Telegram iOS UI Kit: 6916:25064, 6973:36421, 6801:13696, 6802:4522, 6802:22938.
export const colors = {
  blue: '#008BFF',
  text: '#000000',
  muted: 'rgba(60, 60, 67, 0.6)',
  line: '#E6E6E6',
  surface: '#F6F6F8',
  white: '#FFFFFF',
  group: '#F2F2F7',
  incoming: '#FFFFFF',
  outgoing: '#EFFEDD',
  wallpaper: '#F7AD6A',
  red: '#FF3B30',
  control: '#1A1A1A',
  glass: 'rgba(255,255,255,0.65)',
  selection: '#EDEDED',
  profile: '#4890BF',
  outgoingMeta: '#4B9B3E',
  incomingMeta: '#999999',
};
export const type = {
  body: { fontSize: 17, lineHeight: 22, letterSpacing: -0.43 },
  preview: { fontSize: 15, lineHeight: 20, letterSpacing: -0.23 },
  footnote: { fontSize: 13, lineHeight: 18, letterSpacing: -0.08 },
  title: { fontSize: 28, lineHeight: 34, letterSpacing: 0.38, fontWeight: '700' as const },
};
export const layout = { row: 78, avatar: 62, toolbar: 54, tabBar: 62, card: 26, bubble: 18 };
export const systemFont =
  Platform.OS === 'web' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' : undefined;
