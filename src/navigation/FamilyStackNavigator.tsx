import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParamList } from './types';
import FamilyScreen from '../screens/family/FamilyScreen';

const Stack = createNativeStackNavigator<FamilyStackParamList>();

function FamilyStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="FamilyMain">
      <Stack.Screen name="FamilyMain" component={FamilyScreen} options={{ title: '가족' }} />
    </Stack.Navigator>
  );
}

export default FamilyStackNavigator;
