import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from './types';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { createMainScreenOptions } from './TabHeader';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const screenOptions = createMainScreenOptions('SettingsMain', {
  icon: 'Settings',
  title: '설정',
});

function SettingsStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="SettingsMain"
      screenOptions={screenOptions}
    >
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default SettingsStackNavigator;
