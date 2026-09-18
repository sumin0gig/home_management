import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  HomeStackParamList,
  SettingsStackParamList,
} from '../navigation/types';

type HomeNavigation<Screen extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, Screen>['navigation'];

export function createMockNavigation<
  Screen extends keyof HomeStackParamList,
>(): HomeNavigation<Screen> {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as unknown as HomeNavigation<Screen>;
}

type SettingsNavigation<Screen extends keyof SettingsStackParamList> =
  NativeStackScreenProps<SettingsStackParamList, Screen>['navigation'];

export function createMockSettingsNavigation<
  Screen extends keyof SettingsStackParamList,
>(): SettingsNavigation<Screen> {
  const parentNavigate = jest.fn();
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
    getParent: jest.fn(() => ({ navigate: parentNavigate })),
  } as unknown as SettingsNavigation<Screen>;
}
