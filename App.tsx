/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';
import RootNavigator from './src/navigation/RootNavigator';
import { linking } from './src/navigation/linking';
import { useTaskStore } from './src/store/useTaskStore';
import { useRoomStore } from './src/store/useRoomStore';
import { useMascotStore } from './src/store/useMascotStore';
import { syncTaskWidget } from './src/widget/taskWidgetSync';

Amplify.configure(outputs);

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  // 위젯 스냅샷에는 집안일·방 색·마스코트가 들어가므로 셋 중 하나라도 바뀌면 다시 쓴다.
  useEffect(() => {
    const unsubscribes = [
      useTaskStore.subscribe((state, prev) => {
        if (state.tasks !== prev.tasks) {
          syncTaskWidget();
        }
      }),
      useRoomStore.subscribe((state, prev) => {
        if (state.rooms !== prev.rooms) {
          syncTaskWidget();
        }
      }),
      useMascotStore.subscribe((state, prev) => {
        if (state.mascot !== prev.mascot) {
          syncTaskWidget();
        }
      }),
    ];
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

export default App;
