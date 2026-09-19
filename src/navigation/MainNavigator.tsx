import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import RoomDetailScreen from '../screens/home/RoomDetailScreen';
import RoomEditScreen from '../screens/home/RoomEditScreen';
import TaskDetailScreen from '../screens/home/TaskDetailScreen';
import TaskFormScreen from '../screens/home/TaskFormScreen';
import MascotDetailScreen from '../screens/home/MascotDetailScreen';
import FamilyScreen from '../screens/family/FamilyScreen';
import AddFamilyMemberScreen from '../screens/family/AddFamilyMemberScreen';
import ScanFamilyQrScreen from '../screens/family/ScanFamilyQrScreen';
import EnterFamilyCodeScreen from '../screens/family/EnterFamilyCodeScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import {
  createIdentityScreenOptions,
  renderSettingsShortcutButton,
  SettingsShortcutButton,
} from './TabHeader';
import Icon from '../components/common/Icon';

const Stack = createNativeStackNavigator<MainStackParamList>();

function AddFamilyMemberButton(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  return (
    <Icon
      name="PersonPlus"
      onPress={() => navigation.navigate('AddFamilyMember')}
      style={styles.button}
    />
  );
}

function renderFamilyHeaderRight(): React.JSX.Element {
  return (
    <View style={styles.headerRightRow}>
      <AddFamilyMemberButton />
      <SettingsShortcutButton />
    </View>
  );
}

const screenOptions = createIdentityScreenOptions({
  HomeMain: {
    icon: 'Home',
    title: '우리집',
    headerRight: renderSettingsShortcutButton,
  },
  FamilyMain: {
    icon: 'Family',
    title: '가족',
    headerRight: renderFamilyHeaderRight,
  },
  SettingsMain: {
    icon: 'Settings',
    title: '설정',
  },
});

function MainNavigator(): React.JSX.Element {
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
      <Stack.Screen name="FamilyMain" component={FamilyScreen} />
      <Stack.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
      <Stack.Screen name="ScanFamilyQr" component={ScanFamilyQrScreen} />
      <Stack.Screen name="EnterFamilyCode" component={EnterFamilyCodeScreen} />
      <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    </Stack.Navigator>
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

export default MainNavigator;
