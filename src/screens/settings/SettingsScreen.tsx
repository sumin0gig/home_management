import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { signOutUser, getAuthErrorMessage } from "../../api/auth";
import { commonColor } from "../../styles/commonStyle";
import Icon from "../../components/common/Icon";
import type { MainStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<MainStackParamList, "SettingsMain">;

type MenuItemProps = {
  label: string;
  onPress: (() => void) | null;
  color?: keyof typeof commonColor;
};

function MenuItem( {
  label,
  onPress,
  color = "textDefault",
}: MenuItemProps ): React.JSX.Element {
  return (
    <Pressable
      style={ ({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed] }
      onPress={ onPress }
    >
      <Text style={ [styles.menuLabel, { color: commonColor[ color ] }] }>
        { label }
      </Text>
      {
        onPress
        && <Icon name="ChevronRight" size={ 16 } color={ commonColor.textDefault } />
      }
    </Pressable>
  );
}

function SettingsScreen( { navigation }: Props ): React.JSX.Element {
  const [error, setError] = React.useState<string | null>( null );

  const onSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      setError( getAuthErrorMessage( err ) );
    }
  };

  const goToFamily = () => {
    navigation.navigate( "FamilyMain" );
  };

  return (
    <View style={ styles.container }>
      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }
      <MenuItem label="가족 관리" onPress={ goToFamily } />
      <MenuItem label="로그아웃" onPress={ onSignOut } color={ "error" } />
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: commonColor.backgroundColor,
  },
  error: {
    color: commonColor.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: commonColor.divider,
  },
  menuItemPressed: {
    backgroundColor: commonColor.divider,
  },
  menuLabel: {
    fontSize: 16,
  },
  menuLabelDestructive: {
    color: commonColor.negative,
  },
} );

export default SettingsScreen;
