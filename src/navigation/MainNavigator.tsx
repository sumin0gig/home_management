import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import HomeStackNavigator from './HomeStackNavigator';
import FamilyStackNavigator from './FamilyStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

function MainNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator initialRouteName="HomeTab" screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: '홈' }} />
      <Tab.Screen name="FamilyTab" component={FamilyStackNavigator} options={{ title: '가족' }} />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: '설정' }}
      />
    </Tab.Navigator>
  );
}

export default MainNavigator;
