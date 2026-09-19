import React from 'react';
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
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
import { ScreenHeader, SettingsShortcutButton } from './ScreenHeader';

const Stack = createNativeStackNavigator<MainStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  header: props => <ScreenHeader {...props} />,
};

const homeOptions = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<MainStackParamList, 'HomeMain'>;
}): NativeStackNavigationOptions => ({
  title: '우리집',
  headerRight: () => (
    <SettingsShortcutButton
      onPress={() => navigation.navigate('SettingsMain')}
    />
  ),
});

function MainNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="HomeMain" screenOptions={screenOptions}>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={homeOptions}
      />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen
        name="RoomEdit"
        component={RoomEditScreen}
        options={{ title: '방 편집' }}
      />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} />
      <Stack.Screen name="MascotDetail" component={MascotDetailScreen} />
      <Stack.Screen
        name="FamilyMain"
        component={FamilyScreen}
        options={{ title: '가족' }}
      />
      <Stack.Screen name="AddFamilyMember" component={AddFamilyMemberScreen} />
      <Stack.Screen name="ScanFamilyQr" component={ScanFamilyQrScreen} />
      <Stack.Screen name="EnterFamilyCode" component={EnterFamilyCodeScreen} />
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: '설정' }}
      />
    </Stack.Navigator>
  );
}

export default MainNavigator;
