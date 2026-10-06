import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  deleteAccount,
  getAuthErrorMessage,
  openPrivacyPolicy,
  signOutUser,
} from "../../../actions";
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
  const insets = useSafeAreaInsets();
  const [error, setError] = React.useState<string | null>( null );
  const [isDeleting, setIsDeleting] = React.useState( false );

  const onSignOut = () =>
    signOutUser().catch( err => setError( getAuthErrorMessage( err ) ) );

  const goToFamily = () => {
    navigation.navigate( "FamilyMain" );
  };

  const onOpenPrivacyPolicy = () =>
    openPrivacyPolicy().catch( () =>
      setError( "개인정보처리방침을 열 수 없습니다." ),
    );

  const onDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "탈퇴하면 계정과 마스코트가 삭제되며 되돌릴 수 없어요. 혼자 있는 가족의 소유자라면 가족과 방, 집안일도 함께 삭제돼요. 정말 탈퇴하시겠어요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴",
          style: "destructive",
          onPress: () => {
            setIsDeleting( true );
            return deleteAccount()
            .catch( err => setError( getAuthErrorMessage( err ) ) )
            .finally( () => setIsDeleting( false ) );
          },
        },
      ],
    );
  };

  return (
    <View style={ styles.container }>
      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }
      <MenuItem label="가족 관리" onPress={ goToFamily } />
      <MenuItem label="개인정보처리방침" onPress={ onOpenPrivacyPolicy } />
      <MenuItem label="로그아웃" onPress={ onSignOut } color={ "error" } />
      <Pressable
        style={ [styles.deleteAccountButton, { marginBottom: insets.bottom }] }
        onPress={ onDeleteAccount }
        disabled={ isDeleting }
      >
        <Text style={ styles.deleteAccountText }>
          { isDeleting ? "탈퇴 처리 중…" : "회원 탈퇴" }
        </Text>
      </Pressable>
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
  deleteAccountButton: {
    marginTop: "auto",
    alignSelf: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  deleteAccountText: {
    fontSize: 13,
    color: commonColor.textSecondary,
    textDecorationLine: "underline",
  },
} );

export default SettingsScreen;
