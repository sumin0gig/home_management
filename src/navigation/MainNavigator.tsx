import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

function MainNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
    </Stack.Navigator>
  );
}

export default MainNavigator;
