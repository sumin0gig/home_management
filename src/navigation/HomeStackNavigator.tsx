import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import RoomDetailScreen from '../screens/home/RoomDetailScreen';
import ChoreFormScreen from '../screens/home/ChoreFormScreen';
import MascotDetailScreen from '../screens/home/MascotDetailScreen';
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
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen name="ChoreForm" component={ChoreFormScreen} />
      <Stack.Screen name="MascotDetail" component={MascotDetailScreen} />
    </Stack.Navigator>
  );
}

export default HomeStackNavigator;
