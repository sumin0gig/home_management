import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { MainDrawerParamList } from './types';
import { colors, commonColor } from '../styles/commonStyle';
import Icon, { type IconName } from '../components/common/Icon';

type MainDrawerNavigation = DrawerNavigationProp<MainDrawerParamList>;

function TabHeaderLabel({
  iconName,
  title,
}: {
  iconName: IconName;
  title: string;
}): React.JSX.Element {
  return (
    <View style={styles.labelContainer}>
      <Icon name={iconName} size={20} color={colors.black} />
      <Text style={styles.title}>{title}</Text>
      <Icon name="ChevronDown" size={14} color={commonColor.textSecondary} />
    </View>
  );
}

export function createTabHeaderLabel(
  iconName: IconName,
  title: string,
): () => React.JSX.Element {
  return function renderTabHeaderLabel(): React.JSX.Element {
    return <TabHeaderLabel iconName={iconName} title={title} />;
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
    <Icon
      name="Settings"
      size={22}
      color={colors.black}
      onPress={goToSettings}
      style={styles.button}
    />
  );
}

export function renderSettingsShortcutButton(): React.JSX.Element {
  return <SettingsShortcutButton />;
}

type MainScreenHeaderConfig = {
  icon: IconName;
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
