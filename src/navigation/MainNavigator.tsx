import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import type { MainDrawerParamList } from './types';
import HomeStackNavigator from './HomeStackNavigator';
import FamilyStackNavigator from './FamilyStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function MainNavigator(): React.JSX.Element {
  return (
    <Drawer.Navigator
      initialRouteName="HomeTab"
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: '홈' }}
      />
      <Drawer.Screen
        name="FamilyTab"
        component={FamilyStackNavigator}
        options={{ title: '가족' }}
      />
      <Drawer.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: '설정' }}
      />
    </Drawer.Navigator>
  );
}

export default MainNavigator;
