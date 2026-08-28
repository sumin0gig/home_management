import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  RoomDetail: { roomId: string };
  ChoreForm: { choreId?: string; roomId?: string } | undefined;
};

export type FamilyStackParamList = {
  FamilyMain: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
};

export type MainDrawerParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  FamilyTab: NavigatorScreenParams<FamilyStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};
