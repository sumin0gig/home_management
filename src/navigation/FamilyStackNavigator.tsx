import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { FamilyStackParamList } from './types';
import FamilyScreen from '../screens/family/FamilyScreen';
import AddFamilyMemberScreen from '../screens/family/AddFamilyMemberScreen';
import ScanFamilyQrScreen from '../screens/family/ScanFamilyQrScreen';
import EnterFamilyCodeScreen from '../screens/family/EnterFamilyCodeScreen';
import { createMainScreenOptions, SettingsShortcutButton } from './TabHeader';
import PeopleIcon from 'bootstrap-icons/icons/people.svg';
import { colors } from '../styles/commonStyle';

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
  headerRightRow: {
    flexDirection: 'row',
  },
  button: {
    paddingHorizontal: 12,
  },
  icon: {
    fontSize: 18,
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
  icon: <PeopleIcon width={20} height={20} color={colors.black} />,
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
