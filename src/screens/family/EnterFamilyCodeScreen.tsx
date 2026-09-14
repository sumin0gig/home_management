import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { FamilyStackParamList } from "../../navigation/types";
import { useFamilyStore } from "../../store/useFamilyStore";
import { colors, commonColor } from "../../styles/commonStyle";

type Props = NativeStackScreenProps<FamilyStackParamList, "EnterFamilyCode">;

function EnterFamilyCodeScreen( { navigation }: Props ): React.JSX.Element {
  const error = useFamilyStore( state => state.error );
  const joinFamily = useFamilyStore( state => state.joinFamily );

  const [inviteCode, setInviteCode] = React.useState( "" );
  const [isJoining, setIsJoining] = React.useState( false );

  React.useEffect( () => {
    navigation.setOptions( { title: "가족 코드 입력" } );
  }, [navigation] );

  const onJoin = async () => {
    if (!inviteCode.trim()) return;
    setIsJoining( true );
    try {
      await joinFamily( inviteCode.trim() );
      navigation.popToTop();
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsJoining( false );
    }
  };

  return (
    <View style={ styles.container }>
      <Text style={ styles.title }> 가족 코드를 입력해주세요 </Text>
      <Text style={ styles.description }>
        전달받은 초대 코드를 입력하면 가족에 참여할 수 있어요.
      </Text>

      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <TextInput
        style={ styles.input }
        placeholder="초대 코드"
        value={ inviteCode }
        onChangeText={ setInviteCode }
        autoCapitalize="characters"
      />

      <Pressable style={ styles.button } onPress={ onJoin } disabled={ isJoining }>
        {
          isJoining
          ? <ActivityIndicator color={ colors.white } />
          : <Text style={ styles.buttonText }> 참여하기 </Text>
        }
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
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: commonColor.textMuted,
    marginBottom: 24,
  },
  error: {
    color: commonColor.negative,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default EnterFamilyCodeScreen;
