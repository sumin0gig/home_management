import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type FamilyStackParamList = {
  FamilyMain: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  FamilyTab: NavigatorScreenParams<FamilyStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};
