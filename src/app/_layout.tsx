import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StoreProvider } from '../store';
import { C } from '../ui';
import { GlassEnvironment } from '../glass';
import { useState } from 'react';
import { FontGate } from '../font-gate';
import { Wallpaper } from '../wallpaper';
import { PreferencesProvider } from '../preferences';
import { WebShell } from '../web-shell';

export const unstable_settings = { anchor: '(tabs)' };
export default function RootLayout() {
  const [fontAttempt, setFontAttempt] = useState(0);
  const pathname = usePathname();
  const colored = pathname === '/settings' || pathname.startsWith('/profile/');
  const chat = pathname.startsWith('/chat/');
  const backgroundColor = colored
    ? C.profile
    : pathname.startsWith('/chat/')
      ? C.wallpaper
      : C.white;
  return (
    <SafeAreaProvider>
      <WebShell />
      <FontGate key={fontAttempt} retry={() => setFontAttempt((attempt) => attempt + 1)}>
        <PreferencesProvider>
          <View style={styles.desktop}>
            <View nativeID="app-phone" style={styles.phone}>
              {chat && <Wallpaper root />}
              <StatusBar style="dark" />
              <SafeAreaView
                edges={['top', 'left', 'right']}
                style={[styles.safe, { backgroundColor: chat ? 'transparent' : backgroundColor }]}
              >
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
                        options={{
                          presentation: 'fullScreenModal',
                          animation: 'slide_from_bottom',
                        }}
                      />
                    </Stack>
                  </GlassEnvironment>
                </StoreProvider>
              </SafeAreaView>
            </View>
          </View>
        </PreferencesProvider>
      </FontGate>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  desktop: { flex: 1, backgroundColor: '#E0E5EA', alignItems: 'center' },
  phone: {
    flex: 1,
    width: '100%',

    backgroundColor: C.surface,
  },
  safe: { flex: 1, backgroundColor: C.surface },
});
