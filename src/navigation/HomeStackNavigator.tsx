import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import RoomDetailScreen from '../screens/home/RoomDetailScreen';
import RoomEditScreen from '../screens/home/RoomEditScreen';
import TaskFormScreen from '../screens/home/TaskFormScreen';
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
      <Stack.Screen
        name="RoomEdit"
        component={RoomEditScreen}
        options={{ title: '방 편집' }}
      />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} />
      <Stack.Screen name="MascotDetail" component={MascotDetailScreen} />
    </Stack.Navigator>
  );
}

export default HomeStackNavigator;
