import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';

function DrawerMenuButton(): React.JSX.Element {
  const navigation = useNavigation();

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={styles.button}
      hitSlop={12}
    >
      <Text style={styles.icon}>☰</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
  },
  icon: {
    fontSize: 22,
  },
});

export function renderDrawerMenuButton(): React.JSX.Element {
  return <DrawerMenuButton />;
}

export default DrawerMenuButton;
