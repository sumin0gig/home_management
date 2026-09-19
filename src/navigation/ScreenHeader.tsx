import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';
import { colors } from '../styles/commonStyle';
import Icon, { type IconName } from '../components/common/Icon';

const ROUTE_ICONS: Partial<Record<keyof MainStackParamList, IconName>> = {
  HomeMain: 'Home',
};

export function ScreenHeader({
  back,
  options,
  route,
  navigation,
}: NativeStackHeaderProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const iconName = ROUTE_ICONS[route.name as keyof MainStackParamList];
  const title = options.title ?? route.name;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.left}>

          {
            back
            ? <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Icon name="ChevronLeft" size={20} color={colors.black} />
            </Pressable>
            : null
          }

          {
            iconName
            ? <Icon name={iconName} size={20} color={colors.black} />
            : null
          }
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        
        {options.headerRight?.({ canGoBack: !!back })}
      </View>
    </View>
  );
}

export function SettingsShortcutButton({
  onPress,
}: {
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Icon
      name="Settings"
      size={22}
      color={colors.black}
      onPress={onPress}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
  },
  backButton: {
    paddingEnd: 4,
  },
  title: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.black,
  },
  button: {
    paddingHorizontal: 12,
  },
});
