import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFamilyStore } from "../../store/useFamilyStore";
import type { FamilyMemberRow } from "../../api/family";
import { commonColor } from "../../styles/commonStyle";

function FamilyScreen(): React.JSX.Element {
  const family = useFamilyStore( state => state.family );
  const membership = useFamilyStore( state => state.membership );
  const members = useFamilyStore( state => state.members );
  const error = useFamilyStore( state => state.error );
  const renameFamily = useFamilyStore( state => state.renameFamily );
  const removeMember = useFamilyStore( state => state.removeMember );
  const leaveFamily = useFamilyStore( state => state.leaveFamily );

  const [isEditingName, setIsEditingName] = React.useState( false );
  const [nameDraft, setNameDraft] = React.useState( family?.name ?? "" );
  const [isSaving, setIsSaving] = React.useState( false );
  const [isLeaving, setIsLeaving] = React.useState( false );

  if (!family || !membership) {
    return (
      <View style={ styles.container }>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isOwner = membership.role === "OWNER";

  const handleStartEdit = () => {
    setNameDraft( family.name );
    setIsEditingName( true );
  };

  const handleSaveName = async () => {
    if (!nameDraft.trim()) {
      return;
    }
    setIsSaving( true );
    try {
      await renameFamily( nameDraft.trim() );
      setIsEditingName( false );
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsSaving( false );
    }
  };

  const handleRemoveMember = (member: FamilyMemberRow) => {
    Alert.alert( "멤버 제거", `${member.displayName}님을 가족에서 제거할까요?`, [
      { text: "취소", style: "cancel" },
      {
        text: "제거",
        style: "destructive",
        onPress: () => removeMember( member.id ),
      },
    ] );
  };

  const handleLeave = () => {
    Alert.alert( "가족 떠나기", "정말 이 가족을 떠나시겠어요?", [
      { text: "취소", style: "cancel" },
      {
        text: "떠나기",
        style: "destructive",
        onPress: async () => {
          setIsLeaving( true );
          try {
            await leaveFamily();
          } catch (err) {
            Alert.alert( "오류", (err as Error).message );
          } finally {
            setIsLeaving( false );
          }
        },
      },
    ] );
  };

  return (
    <View style={ styles.container }>
      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <View style={ styles.header }>
        {
          isEditingName
          ? <View style={ styles.editNameRow }>
            <TextInput
              style={ styles.nameInput }
              value={ nameDraft }
              onChangeText={ setNameDraft }
              autoFocus
            />
            <Pressable
              onPress={ handleSaveName }
              disabled={ isSaving }
              style={ styles.saveButton }
            >
              <Text style={ styles.saveButtonText }>
                { isSaving ? "저장 중" : "저장" }
              </Text>
            </Pressable>
          </View>
          : <Pressable onPress={ isOwner ? handleStartEdit : undefined }>
            <Text style={ styles.familyName }>
              { family.name }
              { isOwner ? " ✎" : "" }
            </Text>
          </Pressable>
        }
        <Text style={ styles.inviteLabel }> 초대 코드 (가족에게 공유하세요) </Text>
        <Text style={ styles.inviteCode } selectable>
          { family.inviteCode }
        </Text>
      </View>

      <Text style={ styles.membersTitle }> 멤버 ( { members.length } ) </Text>
      <FlatList
        data={ members }
        keyExtractor={ item => item.id }
        renderItem={ ({ item }) => (
          <View style={ styles.memberRow }>
            <View>
              <Text style={ styles.memberName }> { item.displayName } </Text>
              <Text style={ styles.memberRole }>
                { item.role === "OWNER" ? "관리자" : "구성원" }
              </Text>
            </View>
            {
              isOwner && item.id !== membership.id
              ? <Pressable onPress={ () => handleRemoveMember( item ) }>
                <Text style={ styles.removeText }> 제거 </Text>
              </Pressable>
              : null
            }
          </View>
        ) }
      />

      <Pressable
        style={ styles.leaveButton }
        onPress={ handleLeave }
        disabled={ isLeaving }
      >
        <Text style={ styles.leaveButtonText }>
          { isLeaving ? "처리 중..." : "가족 떠나기" }
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  header: {
    marginBottom: 24,
  },
  familyName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  editNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 18,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  inviteLabel: {
    fontSize: 13,
    color: "#555",
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 4,
    marginTop: 4,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  memberName: {
    fontSize: 16,
  },
  memberRole: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  removeText: {
    color: commonColor.negative,
    fontWeight: "600",
  },
  error: {
    color: "#d32f2f",
    marginBottom: 16,
    textAlign: "center",
  },
  leaveButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: commonColor.negative,
  },
  leaveButtonText: {
    color: commonColor.negative,
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default FamilyScreen;
