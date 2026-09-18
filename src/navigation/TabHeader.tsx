import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { MainDrawerParamList } from './types';
import { colors, commonColor } from '../styles/commonStyle';
import ChevronDownIcon from 'bootstrap-icons/icons/chevron-down.svg';
import GearIcon from 'bootstrap-icons/icons/gear.svg';

type MainDrawerNavigation = DrawerNavigationProp<MainDrawerParamList>;

function TabHeaderLabel({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}): React.JSX.Element {
  return (
    <View style={styles.labelContainer}>
      {icon}
      <Text style={styles.title}>{title}</Text>
      <ChevronDownIcon
        width={14}
        height={14}
        color={commonColor.textSecondary}
      />
    </View>
  );
}

export function createTabHeaderLabel(
  icon: React.ReactNode,
  title: string,
): () => React.JSX.Element {
  return function renderTabHeaderLabel(): React.JSX.Element {
    return <TabHeaderLabel icon={icon} title={title} />;
  };
}

export function SettingsShortcutButton(): React.JSX.Element {
  const navigation = useNavigation();

  const goToSettings = () => {
    navigation
      .getParent<MainDrawerNavigation>()
      ?.navigate('SettingsTab', { screen: 'SettingsMain' });
  };

  return (
    <Pressable onPress={goToSettings} style={styles.button} hitSlop={12}>
      <GearIcon width={22} height={22} color={colors.black} />
    </Pressable>
  );
}

export function renderSettingsShortcutButton(): React.JSX.Element {
  return <SettingsShortcutButton />;
}

type MainScreenHeaderConfig = {
  icon: React.ReactNode;
  title: string;
  headerRight?: () => React.JSX.Element;
};

// Returning {} for non-main routes leaves native-stack's default back button + title untouched.
export function createMainScreenOptions(
  mainRouteName: string,
  { icon, title, headerRight }: MainScreenHeaderConfig,
): (props: { route: { name: string } }) => NativeStackNavigationOptions {
  return ({ route }) => {
    if (route.name !== mainRouteName) {
      return {};
    }
    return {
      headerTitle: () => null,
      headerLeft: createTabHeaderLabel(icon, title),
      headerRight,
    };
  };
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.black,
  },
  button: {
    paddingHorizontal: 12,
  },
});
