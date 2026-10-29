import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainStackParamList } from "../../navigation/types";
import { useFamilyStore } from "../../store/useFamilyStore";
import type { FamilyMemberRow } from "../../store/useFamilyStore";
import { useRoomStore } from "../../store/useRoomStore";
import { useTaskStore } from "../../store/useTaskStore";
import { OWNER_TRANSFER_ENABLED } from "../../constants/app";
import { avatarColor, avatarInitials } from "../../utils/avatar";
import { colors, commonColor } from "../../styles/commonStyle";
import ConfirmSheet from "../../components/common/ConfirmSheet";
import ActionSheet from "../../components/common/ActionSheet";

type Props = NativeStackScreenProps<MainStackParamList, "FamilyMain">;

// 한 번에 시트 하나만 띄운다 (RN Modal을 겹치지 않는다).
type Sheet =
  | { kind: "rename" }
  | { kind: "memberMenu"; member: FamilyMemberRow }
  | { kind: "transfer"; member: FamilyMemberRow }
  | { kind: "remove"; member: FamilyMemberRow }
  | { kind: "leaveMember" }
  | { kind: "leaveOwnerAlone" }
  | { kind: "leaveOwnerTransfer" }
  | { kind: "leaveOwnerBlocked" };

function MemberAvatar( { member }: { member: FamilyMemberRow } ): React.JSX.Element {
  return (
    <View style={ [styles.avatar, { backgroundColor: avatarColor( member.id ) }] }>
      <Text style={ styles.avatarText }> { avatarInitials( member.displayName ) } </Text>
    </View>
  );
}

function FamilyScreen( { navigation }: Props ): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const family = useFamilyStore( state => state.family );
  const membership = useFamilyStore( state => state.membership );
  const members = useFamilyStore( state => state.members );
  const renameFamily = useFamilyStore( state => state.renameFamily );
  const removeMember = useFamilyStore( state => state.removeMember );
  const leaveFamily = useFamilyStore( state => state.leaveFamily );
  const transferOwnership = useFamilyStore( state => state.transferOwnership );
  const roomCount = useRoomStore( state => state.rooms.length );
  const taskCount = useTaskStore( state => state.tasks.length );

  const [sheet, setSheet] = React.useState<Sheet | null>( null );
  const [isWorking, setIsWorking] = React.useState( false );
  const [sheetError, setSheetError] = React.useState<string | null>( null );
  const [nameDraft, setNameDraft] = React.useState( "" );
  // 관리자를 넘기고 떠날 때 고른 구성원 (기본 선택 없음)
  const [heirId, setHeirId] = React.useState<string | null>( null );

  if (!family || !membership) {
    return (
      <View style={ [styles.screen, styles.center] }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOwner = membership.role === "OWNER";
  const others = members.filter( m => m.id !== membership.id );
  const isAloneOwner = isOwner && others.length === 0;

  const openSheet = ( next: Sheet ) => {
    setSheetError( null );
    setSheet( next );
  };
  const closeSheet = () => {
    if (!isWorking) {
      setSheet( null );
    }
  };

  // 진행 중에는 시트가 닫히지 않고, 실패하면 시트 안에 오류를 보여준다.
  const run = ( action: () => Promise<boolean> ) => {
    setIsWorking( true );
    setSheetError( null );
    return action()
    .then( ok =>
      ok
        ? setSheet( null )
        : setSheetError(
          useFamilyStore.getState().error ?? "처리하지 못했어요.",
        ),
    )
    .finally( () => setIsWorking( false ) );
  };

  const onLeavePress = () => {
    if (!isOwner) {
      openSheet( { kind: "leaveMember" } );
    } else if (isAloneOwner) {
      openSheet( { kind: "leaveOwnerAlone" } );
    } else if (OWNER_TRANSFER_ENABLED) {
      setHeirId( null );
      openSheet( { kind: "leaveOwnerTransfer" } );
    } else {
      openSheet( { kind: "leaveOwnerBlocked" } );
    }
  };

  const heir = others.find( m => m.id === heirId );
  const trimmedName = nameDraft.trim();

  const onSaveFamilyName = () => {
    if (!trimmedName || isWorking) {
      return;
    }
    return run( () => renameFamily( trimmedName ) );
  };

  const onTransferAndLeave = () => {
    if (!heir) {
      return;
    }
    // 넘긴 뒤에는 구성원이 되므로 그대로 떠날 수 있다.
    return run( () =>
      transferOwnership( heir.id ).then( ok => ( ok ? leaveFamily() : false ) ),
    );
  };

  const errorText = sheetError
    ? <Text style={ styles.sheetError }> { sheetError } </Text>
    : null;

  const renderSheet = (): React.JSX.Element | null => {
    if (!sheet) {
      return null;
    }
    switch (sheet.kind) {
      case "rename":
        return (
          <ConfirmSheet
            visible
            title="가족 이름"
            confirmText="저장"
            confirmDisabled={ !trimmedName }
            isConfirming={ isWorking }
            onConfirm={ onSaveFamilyName }
            onCancel={ closeSheet }
          >
            <TextInput
              style={ styles.input }
              value={ nameDraft }
              onChangeText={ setNameDraft }
              maxLength={ 20 }
              returnKeyType="done"
              onSubmitEditing={ onSaveFamilyName }
              autoFocus
              accessibilityLabel="가족 이름"
            />
            { errorText }
          </ConfirmSheet>
        );
      case "memberMenu":
        return (
          <ActionSheet
            visible
            title={ sheet.member.displayName }
            actions={ [
              ...( OWNER_TRANSFER_ENABLED
                ? [{
                    label: "관리자 넘기기",
                    onPress: () => openSheet( { kind: "transfer", member: sheet.member } ),
                  }]
                : [] ),
              {
                label: "가족에서 내보내기",
                tone: "danger" as const,
                onPress: () => openSheet( { kind: "remove", member: sheet.member } ),
              },
            ] }
            onCancel={ closeSheet }
          />
        );
      case "transfer":
        return (
          <ConfirmSheet
            visible
            title={ `${sheet.member.displayName}님에게 관리자를 넘길까요?` }
            description="넘기면 나는 구성원이 돼요."
            confirmText="넘기기"
            isConfirming={ isWorking }
            onConfirm={ () => run( () => transferOwnership( sheet.member.id ) ) }
            onCancel={ closeSheet }
          >
            { errorText }
          </ConfirmSheet>
        );
      case "remove":
        return (
          <ConfirmSheet
            visible
            title={ `${sheet.member.displayName}님을 내보낼까요?` }
            description={ `${sheet.member.displayName}님이 완료한 기록은 남아요.` }
            confirmText="내보내기"
            confirmTone="danger"
            isConfirming={ isWorking }
            onConfirm={ () => run( () => removeMember( sheet.member.id ) ) }
            onCancel={ closeSheet }
          >
            { errorText }
          </ConfirmSheet>
        );
      case "leaveMember":
        return (
          <ConfirmSheet
            visible
            title="우리집에서 나갈까요?"
            description="방과 집안일은 가족에게 그대로 남아요. 내가 완료한 기록도 남아요. 다시 들어오려면 초대 코드가 필요해요."
            confirmText="나가기"
            confirmTone="danger"
            isConfirming={ isWorking }
            onConfirm={ () => run( leaveFamily ) }
            onCancel={ closeSheet }
          >
            { errorText }
          </ConfirmSheet>
        );
      case "leaveOwnerAlone":
        return (
          <ConfirmSheet
            visible
            title="떠나면 우리집이 삭제돼요"
            confirmText="우리집 삭제하고 떠나기"
            confirmTone="danger"
            isConfirming={ isWorking }
            onConfirm={ () => run( leaveFamily ) }
            onCancel={ closeSheet }
          >
            <View style={ styles.deleteList } testID="leave-delete-list">
              <Text style={ styles.deleteItem }>
                { `· 방 ${roomCount}개와 집안일 ${taskCount}개` }
              </Text>
              <Text style={ styles.deleteItem }> · 지금까지의 완료 기록 전부 </Text>
            </View>
            <Text style={ styles.keepNote }> 내 계정과 마스코트는 남아요. </Text>
            { errorText }
          </ConfirmSheet>
        );
      case "leaveOwnerTransfer":
        return (
          <ConfirmSheet
            visible
            title="관리자를 넘겨야 떠날 수 있어요"
            description="우리집을 맡을 사람을 골라주세요. 방과 집안일은 그대로 남아요."
            confirmText={
              heir
                ? `${heir.displayName}님에게 넘기고 떠나기`
                : "넘길 사람을 골라주세요"
            }
            confirmTone="danger"
            confirmDisabled={ !heir }
            isConfirming={ isWorking }
            onConfirm={ onTransferAndLeave }
            onCancel={ closeSheet }
          >
            <View style={ styles.radioList } accessibilityRole="radiogroup">
              { others.map( member => {
                const isSelected = member.id === heirId;
                return (
                  <Pressable
                    key={ member.id }
                    style={ [styles.radioRow, isSelected && styles.radioRowSelected] }
                    onPress={ () => setHeirId( member.id ) }
                    accessibilityRole="radio"
                    accessibilityState={ { selected: isSelected } }
                  >
                    <View style={ [styles.radio, isSelected && styles.radioSelected] } />
                    <MemberAvatar member={ member } />
                    <Text style={ styles.memberName }> { member.displayName } </Text>
                  </Pressable>
                );
              } ) }
            </View>
            { errorText }
          </ConfirmSheet>
        );
      case "leaveOwnerBlocked":
        return (
          <ConfirmSheet
            visible
            title="지금은 떠날 수 없어요"
            description="다른 구성원이 있는 동안에는 관리자가 떠날 수 없어요. 구성원을 내보낸 뒤 떠날 수 있어요."
            confirmText="확인"
            hideCancel
            onConfirm={ closeSheet }
            onCancel={ closeSheet }
          />
        );
    }
  };

  return (
    <ScrollView
      style={ styles.screen }
      contentContainerStyle={ [
        styles.content,
        { paddingBottom: insets.bottom + 24 },
      ] }
    >
      { /* 1. 가족 카드 */ }
      <View style={ styles.familyCard }>
        <View style={ styles.familyNameRow }>
          <Text style={ styles.familyName } numberOfLines={ 1 }> { family.name } </Text>
          {
            isOwner
            ? <Pressable
                onPress={ () => {
                  setNameDraft( family.name );
                  openSheet( { kind: "rename" } );
                } }
                hitSlop={ 10 }
                accessibilityRole="button"
              >
                <Text style={ styles.renameText }> 이름 바꾸기 </Text>
              </Pressable>
            : null
          }
        </View>
        <Text style={ styles.familyMeta }>
          { `구성원 ${members.length}명 · 방 ${roomCount}개 · 집안일 ${taskCount}개` }
        </Text>
      </View>

      { /* 2. 구성원 */ }
      <Text style={ styles.groupTitle } accessibilityRole="header"> 구성원 </Text>
      <View style={ styles.group }>
        { members.map( (member, index) => {
          const isMe = member.id === membership.id;
          return (
            <View
              key={ member.id }
              style={ [styles.memberRow, index > 0 && styles.divider] }
              testID={ `member-${member.id}` }
            >
              <MemberAvatar member={ member } />
              <View style={ styles.memberBody }>
                <View style={ styles.memberNameRow }>
                  <Text style={ styles.memberName } numberOfLines={ 1 }>
                    { member.displayName }
                  </Text>
                  {
                    isMe
                    ? <View style={ styles.mePill }>
                        <Text style={ styles.mePillText }> 나 </Text>
                      </View>
                    : null
                  }
                </View>
                <Text style={ styles.memberRole }>
                  { member.role === "OWNER" ? "관리자" : "구성원" }
                </Text>
              </View>
              {
                isOwner && !isMe
                ? <Pressable
                    style={ styles.moreButton }
                    onPress={ () => openSheet( { kind: "memberMenu", member } ) }
                    accessibilityRole="button"
                    accessibilityLabel={ `${member.displayName} 메뉴` }
                  >
                    <Text style={ styles.moreText }> ⋯ </Text>
                  </Pressable>
                : null
              }
            </View>
          );
        } ) }
        <Pressable
          style={ [styles.memberRow, styles.divider] }
          onPress={ () => navigation.navigate( "AddFamilyMember" ) }
          accessibilityRole="button"
        >
          <View style={ [styles.avatar, styles.inviteAvatar] }>
            <Text style={ styles.invitePlus }> + </Text>
          </View>
          <Text style={ styles.inviteText }> 가족 초대하기 </Text>
        </Pressable>
      </View>

      { /* 3. 떠나기 */ }
      <Pressable
        style={ styles.leaveButton }
        onPress={ onLeavePress }
        accessibilityRole="button"
      >
        <Text style={ styles.leaveText }>
          { isAloneOwner ? "우리집 삭제하고 떠나기" : "가족 떠나기" }
        </Text>
      </Pressable>

      { renderSheet() }
    </ScrollView>
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
    padding: 16,
  },
  familyCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    gap: 4,
    marginBottom: 24,
  },
  familyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  familyName: {
    flexShrink: 1,
    fontSize: 21,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  renameText: {
    fontSize: 12,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  familyMeta: {
    fontSize: 12.5,
    color: commonColor.textMuted,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: commonColor.textSecondary,
    marginLeft: 4,
    marginBottom: 6,
  },
  group: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0, 0, 0, 0.12)",
  },
  memberRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  memberBody: {
    flex: 1,
    gap: 2,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  mePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: commonColor.textDefault,
  },
  mePillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.white,
  },
  memberRole: {
    fontSize: 11.5,
    color: commonColor.textMuted,
  },
  moreButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  moreText: {
    fontSize: 20,
    color: commonColor.textMuted,
  },
  inviteAvatar: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: commonColor.touchable,
  },
  invitePlus: {
    fontSize: 18,
    color: commonColor.touchable,
  },
  inviteText: {
    fontSize: 14,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  leaveButton: {
    alignSelf: "center",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 24,
  },
  leaveText: {
    fontSize: 13,
    color: commonColor.textSecondary,
    textDecorationLine: "underline",
  },
  input: {
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
  sheetError: {
    color: commonColor.error,
    marginBottom: 8,
  },
  deleteList: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    gap: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  deleteItem: {
    fontSize: 13.5,
    color: commonColor.textDefault,
  },
  keepNote: {
    fontSize: 13,
    color: commonColor.textMuted,
    marginBottom: 8,
  },
  radioList: {
    gap: 6,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: colors.white,
  },
  radioRowSelected: {
    borderColor: commonColor.textDefault,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: commonColor.textSecondary,
  },
  radioSelected: {
    borderWidth: 6,
    borderColor: commonColor.textDefault,
  },
} );

export default FamilyScreen;
