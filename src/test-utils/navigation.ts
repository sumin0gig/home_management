import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type MainNavigation<Screen extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, Screen>['navigation'];

export function createMockNavigation<
  Screen extends keyof MainStackParamList,
>(): MainNavigation<Screen> {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as unknown as MainNavigation<Screen>;
}
