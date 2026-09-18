import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import RoomDetailScreen from '../screens/home/RoomDetailScreen';
import RoomEditScreen from '../screens/home/RoomEditScreen';
import TaskDetailScreen from '../screens/home/TaskDetailScreen';
import TaskFormScreen from '../screens/home/TaskFormScreen';
import MascotDetailScreen from '../screens/home/MascotDetailScreen';
import {
  createMainScreenOptions,
  renderSettingsShortcutButton,
} from './TabHeader';
import HouseIcon from 'bootstrap-icons/icons/house.svg';
import { colors } from '../styles/commonStyle';

const Stack = createNativeStackNavigator<HomeStackParamList>();

const screenOptions = createMainScreenOptions('HomeMain', {
  icon: <HouseIcon width={20} height={20} color={colors.black} />,
  title: '우리집',
  headerRight: renderSettingsShortcutButton,
});

function HomeStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="HomeMain" screenOptions={screenOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen
        name="RoomEdit"
        component={RoomEditScreen}
        options={{ title: '방 편집' }}
      />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} />
      <Stack.Screen name="MascotDetail" component={MascotDetailScreen} />
    </Stack.Navigator>
  );
}

export default HomeStackNavigator;
