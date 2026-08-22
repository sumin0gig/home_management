import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import ChoreFormScreen from '../screens/home/ChoreFormScreen';
import { renderDrawerMenuButton } from './DrawerMenuButton';

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="HomeMain">
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: '홈', headerLeft: renderDrawerMenuButton }}
      />
      <Stack.Screen name="ChoreForm" component={ChoreFormScreen} />
    </Stack.Navigator>
  );
}

export default HomeStackNavigator;
