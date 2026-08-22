import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from './types';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { renderDrawerMenuButton } from './DrawerMenuButton';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

function SettingsStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="SettingsMain">
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: '설정', headerLeft: renderDrawerMenuButton }}
      />
    </Stack.Navigator>
  );
}

export default SettingsStackNavigator;
