import React from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DeviceInfo from "react-native-device-info";
import {
  deleteAccount,
  getAuthErrorMessage,
  openPrivacyPolicy,
  signOutUser,
} from "../../../actions";
import { useFamilyStore } from "../../store/useFamilyStore";
import { useMascotStore } from "../../store/useMascotStore";
import { computeHappinessLevel } from "../../utils/happiness";
import { FEEDBACK_URL } from "../../constants/app";
import { colors, commonColor } from "../../styles/commonStyle";
import MascotFace from "../../components/Mascot/MascotFace";
import { useMascotConfig } from "../../components/Mascot/useMascotConfig";
import ConfirmSheet from "../../components/common/ConfirmSheet";
import SettingsGroup from "../../components/Settings/SettingsGroup";
import SettingsRow from "../../components/Settings/SettingsRow";
import type { MainStackParamList } from "../../navigation/types";
import { useWidgetInstalled } from "../../widget/useWidgetInstalled";
import {
  loadWidgetShowMascot,
  saveWidgetShowMascot,
} from "../../widget/taskWidgetSync";

type Props = NativeStackScreenProps<MainStackParamList, "SettingsMain">;

const MAX_DISPLAY_NAME = 12;

// 런처의 "위젯 설정"은 Android 12(API 31)부터 동작한다.
function supportsWidgetReconfigure(): boolean {
  return Platform.OS === "android" && Number( Platform.Version ) >= 31;
}

function SettingsScreen( { navigation }: Props ): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const membership = useFamilyStore( state => state.membership );
  const members = useFamilyStore( state => state.members );
  const updateMyDisplayName = useFamilyStore( state => state.updateMyDisplayName );
  const happiness = useMascotStore( state => state.mascot?.happiness ?? 0 );
  const mascotConfig = useMascotConfig();
  const widgetInstalled = useWidgetInstalled( navigation );

  const [error, setError] = React.useState<string | null>( null );
  const [isDeleting, setIsDeleting] = React.useState( false );

  // 이름 바꾸기
  const [isRenaming, setIsRenaming] = React.useState( false );
  const [nameDraft, setNameDraft] = React.useState( "" );
  const [isSavingName, setIsSavingName] = React.useState( false );
  const [nameError, setNameError] = React.useState<string | null>( null );
  const trimmedName = nameDraft.trim();

  // 로그아웃 확인
  const [isConfirmingSignOut, setIsConfirmingSignOut] = React.useState( false );
  const [isSigningOut, setIsSigningOut] = React.useState( false );

  const [showMascotOnWidget, setShowMascotOnWidget] =
    React.useState<boolean | null>( null );
  React.useEffect( () => {
    if (Platform.OS === "android") {
      loadWidgetShowMascot().then( setShowMascotOnWidget );
    }
  }, [] );

  const openRename = () => {
    setNameDraft( membership?.displayName ?? "" );
    setNameError( null );
    setIsRenaming( true );
  };

  const onSaveName = () => {
    if (!trimmedName || isSavingName) {
      return;
    }
    setIsSavingName( true );
    return updateMyDisplayName( trimmedName )
    .then( ok =>
      ok
        ? setIsRenaming( false )
        : setNameError( useFamilyStore.getState().error ),
    )
    .finally( () => setIsSavingName( false ) );
  };

  const onConfirmSignOut = () => {
    setIsSigningOut( true );
    return signOutUser()
    .then( () => setIsConfirmingSignOut( false ) )
    .catch( err => {
      setIsConfirmingSignOut( false );
      setError( getAuthErrorMessage( err ) );
    } )
    .finally( () => setIsSigningOut( false ) );
  };

  const onOpenPrivacyPolicy = () =>
    openPrivacyPolicy().catch( () =>
      setError( "개인정보처리방침을 열 수 없습니다." ),
    );

  const onOpenFeedback = () =>
    Linking.openURL( FEEDBACK_URL ).catch( () =>
      setError( "의견 보내기 페이지를 열 수 없습니다." ),
    );

  const onToggleWidgetMascot = (value: boolean) => {
    setShowMascotOnWidget( value );
    return saveWidgetShowMascot( value );
  };

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
    <ScrollView
      style={ styles.screen }
      contentContainerStyle={ [
        styles.content,
        { paddingBottom: insets.bottom + 24 },
      ] }
    >
      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      { /* 1. 프로필 카드 */ }
      <View style={ styles.profileCard } testID="settings-profile">
        <View style={ styles.profileFace }>
          {
            mascotConfig
            ? <MascotFace config={ mascotConfig } size={ 30 } />
            : null
          }
        </View>
        <View style={ styles.profileBody }>
          <Text style={ styles.profileName } numberOfLines={ 1 }>
            { membership?.displayName ?? "" }
          </Text>
          <Text style={ styles.profileSub }> Google 계정으로 로그인 중 </Text>
        </View>
        <Pressable
          onPress={ openRename }
          hitSlop={ 10 }
          accessibilityRole="button"
          disabled={ !membership }
        >
          <Text style={ styles.renameText }> 이름 바꾸기 </Text>
        </Pressable>
      </View>

      { /* 2. 우리집 */ }
      <SettingsGroup title="우리집" testID="settings-group-home">
        <SettingsRow
          label="가족 관리"
          value={ `${members.length}명` }
          onPress={ () => navigation.navigate( "FamilyMain" ) }
        />
        <SettingsRow
          label="내 마스코트"
          value={ `추억 Lv.${computeHappinessLevel( happiness ).level}` }
          onPress={ () => navigation.navigate( "MascotDetail" ) }
        />
      </SettingsGroup>

      { /* 3. 홈 화면 위젯 (Android만) */ }
      {
        Platform.OS === "android"
        ? <SettingsGroup
            title="홈 화면 위젯"
            testID="settings-group-widget"
            footnote={
              supportsWidgetReconfigure()
                ? "위젯을 길게 눌러 “위젯 설정”에서도 바꿀 수 있어요."
                : undefined
            }
          >
            {
              widgetInstalled
              ? <SettingsRow label="위젯" value="추가됨" />
              : <SettingsRow
                  label="위젯"
                  value="추가하기"
                  onPress={ () => navigation.navigate( "WidgetPrompt" ) }
                />
            }
            <SettingsRow
              label="위젯에 마스코트 보이기"
              accessory={
                <Switch
                  value={ showMascotOnWidget ?? true }
                  disabled={ showMascotOnWidget === null }
                  onValueChange={ onToggleWidgetMascot }
                  trackColor={ { true: commonColor.touchable } }
                  accessibilityLabel="위젯에 마스코트 보이기"
                />
              }
            />
          </SettingsGroup>
        : null
      }

      { /* 4. 앱 */ }
      <SettingsGroup title="앱" testID="settings-group-app">
        {
          FEEDBACK_URL
          ? <SettingsRow label="의견 보내기" onPress={ onOpenFeedback } />
          : null
        }
        <SettingsRow label="개인정보처리방침" onPress={ onOpenPrivacyPolicy } />
        <SettingsRow label="버전" value={ DeviceInfo.getVersion() } />
      </SettingsGroup>

      { /* 5. 로그아웃 (일반 글자색) */ }
      <SettingsGroup testID="settings-group-signout">
        <SettingsRow
          label="로그아웃"
          onPress={ () => setIsConfirmingSignOut( true ) }
          testID="settings-signout"
        />
      </SettingsGroup>

      { /* 6. 회원 탈퇴 */ }
      <Pressable
        style={ styles.deleteAccountButton }
        onPress={ onDeleteAccount }
        disabled={ isDeleting }
        accessibilityRole="button"
      >
        <Text style={ styles.deleteAccountText }>
          { isDeleting ? "탈퇴 처리 중…" : "회원 탈퇴" }
        </Text>
      </Pressable>

      <ConfirmSheet
        visible={ isRenaming }
        title="가족에게 보이는 이름"
        confirmText="저장"
        confirmDisabled={ !trimmedName }
        isConfirming={ isSavingName }
        onConfirm={ onSaveName }
        onCancel={ () => setIsRenaming( false ) }
      >
        <TextInput
          style={ styles.nameInput }
          value={ nameDraft }
          onChangeText={ setNameDraft }
          maxLength={ MAX_DISPLAY_NAME }
          returnKeyType="done"
          onSubmitEditing={ onSaveName }
          autoFocus
          accessibilityLabel="가족에게 보이는 이름"
        />
        {
          nameError
          ? <Text style={ styles.nameError }> { nameError } </Text>
          : null
        }
      </ConfirmSheet>

      <ConfirmSheet
        visible={ isConfirmingSignOut }
        title="로그아웃할까요?"
        description="다시 Google로 로그인하면 지금 그대로 이어서 쓸 수 있어요."
        confirmText="로그아웃"
        isConfirming={ isSigningOut }
        onConfirm={ onConfirmSignOut }
        onCancel={ () => setIsConfirmingSignOut( false ) }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    backgroundColor: colors.default,
  },
  content: {
    paddingTop: 16,
  },
  error: {
    color: commonColor.error,
    paddingHorizontal: 16,
    paddingBottom: 12,
    textAlign: "center",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 24,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
  },
  profileFace: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.default,
    overflow: "hidden",
  },
  profileBody: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  profileSub: {
    fontSize: 12,
    color: commonColor.textMuted,
  },
  renameText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  deleteAccountButton: {
    alignSelf: "center",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  deleteAccountText: {
    fontSize: 13,
    color: commonColor.textSecondary,
    textDecorationLine: "underline",
  },
  nameInput: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
    backgroundColor: colors.white,
    fontSize: 16,
    color: commonColor.textDefault,
    marginBottom: 8,
  },
  nameError: {
    color: commonColor.error,
    marginBottom: 8,
  },
} );

export default SettingsScreen;
