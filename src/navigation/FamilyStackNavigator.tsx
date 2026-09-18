import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParamList } from './types';
import FamilyScreen from '../screens/family/FamilyScreen';
import AddFamilyMemberScreen from '../screens/family/AddFamilyMemberScreen';
import ScanFamilyQrScreen from '../screens/family/ScanFamilyQrScreen';
import EnterFamilyCodeScreen from '../screens/family/EnterFamilyCodeScreen';
import { createMainScreenOptions, SettingsShortcutButton } from './TabHeader';
import Icon from '../components/common/Icon';

const Stack = createNativeStackNavigator<FamilyStackParamList>();

function AddFamilyMemberButton(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<FamilyStackParamList>>();

  return (
    <Icon
      name="PersonPlus"
      onPress={() => navigation.navigate('AddFamilyMember')}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  headerRightRow: {
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 12,
  },
});

function renderFamilyHeaderRight(): React.JSX.Element {
  return (
    <View style={styles.headerRightRow}>
      <AddFamilyMemberButton />
      <SettingsShortcutButton />
    </View>
  );
}

const screenOptions = createMainScreenOptions('FamilyMain', {
  icon: 'Family',
  title: '가족',
  headerRight: renderFamilyHeaderRight,
});

function FamilyStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="FamilyMain"
      screenOptions={screenOptions}
    >
      <Stack.Screen name="FamilyMain" component={FamilyScreen} />
      <Stack.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
      <Stack.Screen name="ScanFamilyQr" component={ScanFamilyQrScreen} />
      <Stack.Screen name="EnterFamilyCode" component={EnterFamilyCodeScreen} />
    </Stack.Navigator>
  );
}

export default FamilyStackNavigator;
