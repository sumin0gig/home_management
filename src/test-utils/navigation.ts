import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';

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
