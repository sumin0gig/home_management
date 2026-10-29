import React from "react";
import {
  ActivityIndicator,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainStackParamList } from "../../navigation/types";
import { deleteAccount, getAuthErrorMessage } from "../../../actions";
import { useFamilyStore } from "../../store/useFamilyStore";
import { useRoomStore } from "../../store/useRoomStore";
import { useTaskStore } from "../../store/useTaskStore";
import { useMascotStore } from "../../store/useMascotStore";
import { useAuthStore } from "../../store/useAuthStore";
import { computeHappinessLevel } from "../../utils/happiness";
import { OWNER_TRANSFER_ENABLED } from "../../constants/app";
import Icon from "../../components/common/Icon";
import { colors, commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<MainStackParamList, "AccountDelete">;

type Situation = "member" | "aloneOwner" | "ownerWithMembers";

const DANGER_SOFT = "#FDECEA";
const NOTICE_BACKGROUND = colors.tipBackground;

function DeleteItem( { text }: { text: string } ): React.JSX.Element {
  return (
    <View style={ styles.deleteRow }>
      <View style={ styles.deleteMark }>
        <Icon name="Close" size={ 10 } color={ commonColor.error } />
      </View>
      <Text style={ styles.deleteText }> { text } </Text>
    </View>
  );
}

function AccountDeleteScreen( { navigation }: Props ): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const family = useFamilyStore( state => state.family );
  const membership = useFamilyStore( state => state.membership );
  const members = useFamilyStore( state => state.members );
  const refreshMembers = useFamilyStore( state => state.refreshMembers );
  const roomCount = useRoomStore( state => state.rooms.length );
  const taskCount = useTaskStore( state => state.tasks.length );
  const happiness = useMascotStore( state => state.mascot?.happiness ?? 0 );
  const hasMascot = useMascotStore( state => state.mascot !== null );
  const setAccountDeleted = useAuthStore( state => state.setAccountDeleted );

  const [isChecking, setIsChecking] = React.useState( true );
  const [confirmed, setConfirmed] = React.useState( false );
  const [isDeleting, setIsDeleting] = React.useState( false );
  const [error, setError] = React.useState<string | null>( null );

  // 화면이 열릴 때 구성원을 다시 읽고 상황을 판단한다.
  React.useEffect( () => {
    refreshMembers().finally( () => setIsChecking( false ) );
  }, [refreshMembers] );

  // 탈퇴하는 동안에는 뒤로 갈 수 없다.
  React.useEffect( () => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => isDeleting,
    );
    const removeBeforeRemove = navigation.addListener( "beforeRemove", event => {
      if (isDeleting) {
        event.preventDefault();
      }
    } );
    return () => {
      subscription.remove();
      removeBeforeRemove();
    };
  }, [isDeleting, navigation] );

  if (isChecking) {
    return (
      <View
        style={ [styles.screen, styles.center] }
        testID="account-delete-checking"
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOwner = membership?.role === "OWNER";
  const others = members.filter( m => m.id !== membership?.id );
  const situation: Situation = !isOwner
    ? "member"
    : others.length === 0
      ? "aloneOwner"
      : "ownerWithMembers";

  const onDelete = () => {
    if (!confirmed || isDeleting) {
      return;
    }
    setIsDeleting( true );
    setError( null );
    return deleteAccount( {
      // 계정을 지우는 순간 로그아웃되어 화면이 로그인으로 바뀌므로, 완료 안내는 로그인 화면이 띄운다.
      onBeforeDeleteUser: () => setAccountDeleted( true ),
    } )
    .catch( err => {
      setAccountDeleted( false );
      setError( getAuthErrorMessage( err ) );
      setIsDeleting( false );
    } );
  };

  if (situation === "ownerWithMembers") {
    const first = others[0]?.displayName ?? "";
    const together =
      others.length > 1 ? `${first}님 외 ${others.length - 1}명` : `${first}님`;
    const body =
      "관리자가 탈퇴하면 가족 전체가 사라지기 때문에, 먼저 관리자를 넘겨주세요. " +
      (OWNER_TRANSFER_ENABLED
        ? "넘긴 뒤에는 구성원으로 탈퇴할 수 있고, 방과 집안일은 가족에게 남아요."
        : "구성원을 내보낸 뒤 탈퇴할 수 있어요.");
    return (
      <View style={ styles.screen }>
        <ScrollView contentContainerStyle={ styles.content }>
          <Text style={ styles.title } accessibilityRole="header">
            지금은 탈퇴할 수 없어요
          </Text>
          <View style={ styles.noticeBox } testID="account-delete-blocked">
            <Text style={ styles.noticeTitle }>
              { `${family?.name ?? "우리집"}에 ${together}이 함께 있어요` }
            </Text>
            <Text style={ styles.noticeBody }> { body } </Text>
          </View>
        </ScrollView>
        <View style={ [styles.footer, { paddingBottom: insets.bottom + 16 }] }>
          {
            OWNER_TRANSFER_ENABLED
            ? <Pressable
                style={ [styles.button, styles.primaryButton] }
                onPress={ () =>
                  navigation.navigate( "FamilyMain", { transfer: true } )
                }
                accessibilityRole="button"
              >
                <Text style={ styles.primaryText }> 관리자 넘기기 </Text>
              </Pressable>
            : null
          }
          <Pressable
            style={ [
              styles.button,
              OWNER_TRANSFER_ENABLED ? styles.secondaryButton : styles.primaryButton,
            ] }
            onPress={ () => navigation.navigate( "FamilyMain" ) }
            accessibilityRole="button"
          >
            <Text
              style={
                OWNER_TRANSFER_ENABLED ? styles.secondaryText : styles.primaryText
              }
            >
              가족 관리로 가기
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const items = [
    "내 계정과 이름",
    ...( hasMascot
      ? [`내 마스코트와 추억 Lv.${computeHappinessLevel( happiness ).level}`]
      : [] ),
    ...( situation === "aloneOwner"
      ? [
          `${family?.name ?? "우리집"} 가족`,
          `방 ${roomCount}개`,
          `집안일 ${taskCount}개`,
          "지금까지의 완료 기록 전부",
        ]
      : [] ),
  ];

  return (
    <View style={ styles.screen }>
      <ScrollView contentContainerStyle={ styles.content }>
        <Text style={ styles.title } accessibilityRole="header">
          탈퇴하기 전에 확인해주세요
        </Text>

        <Text style={ styles.groupTitle }> 탈퇴하면 지워져요 </Text>
        <View style={ styles.card } testID="account-delete-list">
          { items.map( (item, index) => (
            <View key={ item } style={ index > 0 && styles.divider }>
              <DeleteItem text={ item } />
            </View>
          ) ) }
        </View>

        <Pressable
          style={ styles.checkRow }
          onPress={ () => setConfirmed( value => !value ) }
          accessibilityRole="checkbox"
          accessibilityState={ { checked: confirmed } }
          disabled={ isDeleting }
        >
          <View style={ [styles.checkbox, confirmed && styles.checkboxChecked] }>
            {
              confirmed
              ? <Icon name="Check" size={ 12 } color={ colors.white } />
              : null
            }
          </View>
          <Text style={ styles.checkText }> 되돌릴 수 없다는 걸 확인했어요 </Text>
        </Pressable>

        {
          error
          ? <Text style={ styles.error } accessibilityLiveRegion="polite">
              { error }
            </Text>
          : null
        }
      </ScrollView>

      <View style={ [styles.footer, { paddingBottom: insets.bottom + 16 }] }>
        <Pressable
          style={ [
            styles.button,
            styles.dangerButton,
            !confirmed && styles.buttonDisabled,
          ] }
          onPress={ onDelete }
          disabled={ !confirmed || isDeleting }
          accessibilityRole="button"
          accessibilityState={ { disabled: !confirmed || isDeleting } }
          testID="account-delete-button"
        >
          <Text style={ styles.primaryText }>
            { error ? "다시 시도" : "탈퇴하기" }
          </Text>
        </Pressable>
      </View>

      {
        isDeleting
        ? <View style={ styles.progress } testID="account-delete-progress">
            <ActivityIndicator size="large" color={ colors.white } />
            <Text style={ styles.progressText }>
              탈퇴하는 중이에요. 앱을 닫지 마세요.
            </Text>
          </View>
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    backgroundColor: colors.default,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: commonColor.textDefault,
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: commonColor.textSecondary,
    marginLeft: 4,
    marginBottom: 6,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    overflow: "hidden",
    marginBottom: 20,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.12)",
  },
  deleteRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DANGER_SOFT,
  },
  deleteText: {
    flex: 1,
    fontSize: 14,
    color: commonColor.textDefault,
  },
  checkRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: commonColor.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: commonColor.error,
    backgroundColor: commonColor.error,
  },
  checkText: {
    fontSize: 14,
    color: commonColor.textDefault,
  },
  error: {
    color: commonColor.error,
    marginTop: 12,
  },
  noticeBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: NOTICE_BACKGROUND,
    gap: 6,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.tipContent,
  },
  noticeBody: {
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.tipContent,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: commonColor.touchable,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
    backgroundColor: colors.white,
  },
  dangerButton: {
    backgroundColor: commonColor.error,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: commonColor.textDefault,
  },
  progress: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: commonColor.overlayStrong,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  progressText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
} );

export default AccountDeleteScreen;
