import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider } from '../store';
import { C } from '../ui';
import { GlassEnvironment } from '../glass';

export const unstable_settings = { anchor: '(tabs)' };
export default function RootLayout() {
  const pathname = usePathname();
  const colored = pathname === '/settings' || pathname.startsWith('/profile/');
  const backgroundColor = colored
    ? C.profile
    : pathname.startsWith('/chat/')
      ? C.wallpaper
      : C.white;
  return (
    <SafeAreaProvider>
      <View style={styles.desktop}>
        <View style={styles.phone}>
          <StatusBar style={colored ? 'light' : 'dark'} />
          <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor }]}>
            <StoreProvider>
              <GlassEnvironment>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: C.surface },
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="chat/[id]" />
                  <Stack.Screen name="profile/[id]" />
                  <Stack.Screen
                    name="editor"
                    options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
                  />
                </Stack>
              </GlassEnvironment>
            </StoreProvider>
          </SafeAreaView>
        </View>
      </View>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  desktop: { flex: 1, backgroundColor: '#E0E5EA', alignItems: 'center' },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 460 : undefined,
    backgroundColor: C.surface,
  },
  safe: { flex: 1, backgroundColor: C.surface },
});
