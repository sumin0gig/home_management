import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
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
import { useWidgetInstalled } from "../../widget/useWidgetInstalled";
import {
  loadWidgetShowMascot,
  saveWidgetShowMascot,
} from "../../widget/taskWidgetSync";

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

// "홈 화면 위젯" 묶음 (Android만). 설정 화면 전체 디자인은 09에서 다시 짠다.
function WidgetSettingsSection( {
  onOpenPrompt,
  installed,
}: {
  onOpenPrompt: () => void;
  installed: boolean | null;
} ): React.JSX.Element {
  const [showMascot, setShowMascot] = React.useState<boolean | null>( null );

  React.useEffect( () => {
    loadWidgetShowMascot().then( setShowMascot );
  }, [] );

  const onToggleMascot = (value: boolean) => {
    setShowMascot( value );
    return saveWidgetShowMascot( value );
  };

  return (
    <View>
      <Text style={ styles.sectionTitle } accessibilityRole="header">
        홈 화면 위젯
      </Text>
      <Pressable
        style={ ({ pressed }) => [
          styles.menuItem,
          pressed && !installed && styles.menuItemPressed,
        ] }
        onPress={ installed ? undefined : onOpenPrompt }
        disabled={ !!installed }
        accessibilityRole="button"
        accessibilityState={ { disabled: !!installed } }
      >
        <Text style={ styles.menuLabel }> 위젯 </Text>
        {
          installed
          ? <Text style={ styles.menuValue }> 추가됨 </Text>
          : <Icon name="ChevronRight" size={ 16 } color={ commonColor.textDefault } />
        }
      </Pressable>
      <View style={ styles.menuItem }>
        <Text style={ styles.menuLabel }> 위젯에 마스코트 보이기 </Text>
        <Switch
          value={ showMascot ?? true }
          disabled={ showMascot === null }
          onValueChange={ onToggleMascot }
          trackColor={ { true: commonColor.touchable } }
          accessibilityLabel="위젯에 마스코트 보이기"
        />
      </View>
    </View>
  );
}

function SettingsScreen( { navigation }: Props ): React.JSX.Element {
  const widgetInstalled = useWidgetInstalled( navigation );
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
      {
        Platform.OS === "android"
        ? <WidgetSettingsSection
            installed={ widgetInstalled }
            onOpenPrompt={ () => navigation.navigate( "WidgetPrompt" ) }
          />
        : null
      }
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
  menuValue: {
    fontSize: 14,
    color: commonColor.textSecondary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.textSecondary,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 6,
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
