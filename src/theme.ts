import { Platform } from 'react-native';

// Telegram-iOS 13.1.1: DefaultDayPresentationTheme + ChatMessageItemCommon.
export const colors = {
  blue: '#0088FF',
  text: '#000000',
  muted: '#8E8E93',
  line: '#C8C7CC',
  surface: '#F6F6F8',
  white: '#FFFFFF',
  group: '#EFEFF4',
  incoming: '#FFFFFF',
  outgoing: '#E1FFC7',
  wallpaper: '#DBDDBB',
  red: '#FF3B30',
  control: '#000000',
  glass: 'rgba(255,255,255,0.65)',
  selection: '#EDEDED',
  profile: '#EFEFF4',
  outgoingMeta: 'rgba(0,140,9,0.8)',
  incomingMeta: '#8E8E93',
  outgoingCheck: '#19C700',
  listCheck: '#21C004',
};
export const type = {
  // TextNode: floor(SF17 ascent + descent) = 20, spacing floor(20 * .12) = 2.
  message: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 17, lineHeight: 21 },
  preview: { fontSize: 15, lineHeight: 20 },
  footnote: { fontSize: 13, lineHeight: 16 },
  chatTitle: { fontSize: 16, lineHeight: 19, fontWeight: '600' as const },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '500' as const },
};
export const layout = {
  row: 68,
  avatar: 60,
  toolbar: 64,
  tabBar: 64,
  card: 26,
  bubble: 16,
  mergedBubble: 8,
};
export const systemFont = Platform.OS === 'ios' ? 'System' : 'Inter-Regular';
