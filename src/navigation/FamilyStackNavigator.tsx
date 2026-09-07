import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParamList } from './types';
import FamilyScreen from '../screens/family/FamilyScreen';
import AddFamilyMemberScreen from '../screens/family/AddFamilyMemberScreen';
import ScanFamilyQrScreen from '../screens/family/ScanFamilyQrScreen';
import EnterFamilyCodeScreen from '../screens/family/EnterFamilyCodeScreen';
import { renderDrawerMenuButton } from './DrawerMenuButton';

const Stack = createNativeStackNavigator<FamilyStackParamList>();

function AddFamilyMemberButton(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<FamilyStackParamList>>();

  return (
    <Pressable
      onPress={() => navigation.navigate('AddFamilyMember')}
      style={styles.button}
      hitSlop={12}
    >
      <Text style={styles.icon}>👤＋</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
  },
  icon: {
    fontSize: 18,
  },
});

function renderAddFamilyMemberButton(): React.JSX.Element {
  return <AddFamilyMemberButton />;
}

function FamilyStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="FamilyMain">
      <Stack.Screen
        name="FamilyMain"
        component={FamilyScreen}
        options={{
          title: '가족',
          headerLeft: renderDrawerMenuButton,
          headerRight: renderAddFamilyMemberButton,
        }}
      />
      <Stack.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
      <Stack.Screen name="ScanFamilyQr" component={ScanFamilyQrScreen} />
      <Stack.Screen name="EnterFamilyCode" component={EnterFamilyCodeScreen} />
    </Stack.Navigator>
  );
}

export default FamilyStackNavigator;
