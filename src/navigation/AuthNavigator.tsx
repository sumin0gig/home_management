import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: '로그인' }} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
