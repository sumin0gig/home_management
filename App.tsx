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
import {
  NavigationContainer,
  type LinkingOptions,
} from '@react-navigation/native';

import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';
import RootNavigator from './src/navigation/RootNavigator';
import type { MainStackParamList } from './src/navigation/types';
import { useTaskStore } from './src/store/useTaskStore';
import { syncTaskWidget } from './src/widget/taskWidgetSync';

Amplify.configure(outputs);

// Tapping the home-screen widget opens the app via `homemanagement://tasks`,
// which should always land on the actual task list (HomeMain),
// even if the app was already running on a different screen.
const linking: LinkingOptions<MainStackParamList> = {
  prefixes: ['homemanagement://'],
  config: {
    screens: {
      HomeMain: 'tasks',
    },
  },
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(
    () =>
      useTaskStore.subscribe((state, prevState) => {
        if (state.tasks !== prevState.tasks) {
          syncTaskWidget(state.tasks);
        }
      }),
    [],
  );

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
