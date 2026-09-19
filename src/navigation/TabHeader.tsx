import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type {
  NativeStackNavigationOptions,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import { colors, commonColor } from '../styles/commonStyle';
import Icon, { type IconName } from '../components/common/Icon';

function BackButton(): React.JSX.Element {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={12}
      style={styles.backButton}
    >
      <Icon name="ChevronLeft" size={20} color={colors.black} />
    </Pressable>
  );
}

export function renderBackButton({
  canGoBack,
}: {
  canGoBack?: boolean;
}): React.JSX.Element | null {
  return canGoBack ? <BackButton /> : null;
}

function TabHeaderLabel({
  iconName,
  title,
  canGoBack,
}: {
  iconName: IconName;
  title: string;
  canGoBack?: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.labelContainer}>
      {canGoBack ? <BackButton /> : null}
      <Icon name={iconName} size={20} color={colors.black} />
      <Text style={styles.title}>{title}</Text>
      <Icon name="ChevronDown" size={14} color={commonColor.textSecondary} />
    </View>
  );
}

export function createTabHeaderLabel(
  iconName: IconName,
  title: string,
): (props: { canGoBack?: boolean }) => React.JSX.Element {
  return function renderTabHeaderLabel({ canGoBack }): React.JSX.Element {
    return (
      <TabHeaderLabel iconName={iconName} title={title} canGoBack={canGoBack} />
    );
  };
}

export function SettingsShortcutButton(): React.JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  return (
    <Icon
      name="Settings"
      size={22}
      color={colors.black}
      onPress={() => navigation.navigate('SettingsMain')}
      style={styles.button}
    />
  );
}

export function renderSettingsShortcutButton(): React.JSX.Element {
  return <SettingsShortcutButton />;
}

type IdentityScreenConfig = {
  icon: IconName;
  title: string;
  headerRight?: () => React.JSX.Element;
};

type IdentityScreensConfig = Record<string, IdentityScreenConfig>;

// Routes not listed in `screens` keep their own title but still get the shared
// back button, so every screen's back arrow looks the same.
export function createIdentityScreenOptions(
  screens: IdentityScreensConfig,
): (props: { route: { name: string } }) => NativeStackNavigationOptions {
  return ({ route }) => {
    const config = screens[route.name];
    if (!config) {
      return { headerLeft: renderBackButton };
    }
    return {
      headerTitle: () => null,
      headerLeft: createTabHeaderLabel(config.icon, config.title),
      headerRight: config.headerRight,
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
  backButton: {
    marginRight: 2,
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
