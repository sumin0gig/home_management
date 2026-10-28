import React from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import RoomDetailScreen from '../screens/home/RoomDetailScreen';
import RoomEditScreen from '../screens/home/RoomEditScreen';
import TaskSheetScreen from '../screens/home/TaskSheetScreen';
import TaskFormScreen from '../screens/home/TaskFormScreen';
import CompleteCheckScreen from '../screens/home/CompleteCheckScreen';
import MascotDetailScreen from '../screens/home/MascotDetailScreen';
import MascotCollectionScreen from '../screens/home/MascotCollectionScreen';
import FamilyScreen from '../screens/family/FamilyScreen';
import AddFamilyMemberScreen from '../screens/family/AddFamilyMemberScreen';
import ScanFamilyQrScreen from '../screens/family/ScanFamilyQrScreen';
import EnterFamilyCodeScreen from '../screens/family/EnterFamilyCodeScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { ScreenHeader, SettingsShortcutButton } from './ScreenHeader';
import { FamilyAvatarStack } from './FamilyAvatarStack';

const Stack = createNativeStackNavigator<MainStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  header: props => <ScreenHeader {...props} />,
};

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
      <Stack.Screen
        name="TaskSheet"
        component={TaskSheetScreen}
        options={taskSheetOptions}
      />
      <Stack.Screen name="TaskForm" component={TaskFormScreen} />
      <Stack.Screen
        name="CompleteCheck"
        component={CompleteCheckScreen}
        options={completeCheckOptions}
      />
      <Stack.Screen name="MascotDetail" component={MascotDetailScreen} />
      <Stack.Screen
        name="MascotCollection"
        component={MascotCollectionScreen}
        options={{ title: '추억 도감' }}
      />
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

// 아래에서 올라오는 시트. 올라오는 움직임은 화면 안에서 reanimated로 준다.
const taskSheetOptions: NativeStackNavigationOptions = {
  presentation: 'transparentModal',
  headerShown: false,
  animation: 'fade',
};

// 가벼운 축하는 아래에서 올라오는 시트, 마지막 할 일 축하는 불투명한 전체 화면.
// 둘 다 같은 화면이 variant에 따라 그린다.
const completeCheckOptions: NativeStackNavigationOptions = {
  presentation: 'transparentModal',
  headerShown: false,
  animation: 'fade',
};

const homeOptions = ({
  navigation,
}: {
  navigation: NativeStackNavigationProp<MainStackParamList, 'HomeMain'>;
}): NativeStackNavigationOptions => ({
  title: '우리집',
  headerRight: () => (
    <View style={styles.homeHeaderRight}>
      <FamilyAvatarStack
        onOpenFamily={() => navigation.navigate('FamilyMain')}
        onInvite={() => navigation.navigate('AddFamilyMember')}
      />
      <SettingsShortcutButton
        onPress={() => navigation.navigate('SettingsMain')}
      />
    </View>
  ),
});

const styles = StyleSheet.create({
  homeHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
