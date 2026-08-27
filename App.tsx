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
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';

import { Amplify } from 'aws-amplify';
import outputs from './amplify_outputs.json';
import RootNavigator from './src/navigation/RootNavigator';
import type { MainDrawerParamList } from './src/navigation/types';
import { useChoreStore } from './src/store/useChoreStore';
import { syncChoreWidget } from './src/widget/choreWidgetSync';

Amplify.configure(outputs);

// Tapping the home-screen widget opens the app via `homemanagement://chores`,
// which should always land on the actual chore list (HomeTab > HomeMain),
// even if the app was already running on a different screen.
const linking: LinkingOptions<MainDrawerParamList> = {
  prefixes: ['homemanagement://'],
  config: {
    screens: {
      HomeTab: {
        screens: {
          HomeMain: 'chores',
        },
      },
    },
  },
};

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(
    () =>
      useChoreStore.subscribe((state, prevState) => {
        if (state.chores !== prevState.chores) {
          syncChoreWidget(state.chores);
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
