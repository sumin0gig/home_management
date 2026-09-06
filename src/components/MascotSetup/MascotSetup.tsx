import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Mascot from "../Mascot/Mascot";
import MascotStyleEditor from "../Mascot/MascotStyleEditor";
import { EAR_OPTIONS, TAIL_OPTIONS } from "../Mascot/optionMaps";
import { signOutUser } from "../../api/auth";
import { useMascotStore, type MascotInput } from "../../store/useMascotStore";
import { colors, commonColor } from "../../styles/commonStyle";

function MascotSetup(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const error = useMascotStore( state => state.error );
  const createMascot = useMascotStore( state => state.createMascot );

  const [earStyle, setEarStyle] =
    React.useState<MascotInput["earStyle"]>( "ROUND" );
  const [tailStyle, setTailStyle] =
    React.useState<MascotInput["tailStyle"]>( "STRAIGHT" );
  const [fillColor, setFillColor] = React.useState<string>( colors.yellow );
  const [isSaving, setIsSaving] = React.useState( false );

  const earVariant =
    EAR_OPTIONS.find( option => option.value === earStyle )?.variant ??
    "round";
  const tailVariant =
    TAIL_OPTIONS.find( option => option.value === tailStyle )?.variant ??
    "straight";

  const onSubmit = async () => {
    setIsSaving( true );
    try {
      await createMascot( { earStyle, tailStyle, fillColor } );
    } catch {
      // 에러는 store의 error 상태로 표시됨
    } finally {
      setIsSaving( false );
    }
  };

  return (
    <View style={ styles.container }>
      <Pressable
        style={ [styles.logoutLink, { top: insets.top + 16 }] }
        onPress={ () => signOutUser() }
      >
        <Text style={ styles.logoutLinkText }> 로그아웃 </Text>
      </Pressable>

      <Text style={ styles.stepIndicator }> 3 / 3 단계 · 마스코트 만들기 </Text>
      <Text style={ styles.title }> 집에서 함께할 친구를 만들어봐요 </Text>
      <Text style={ styles.description }>
        친구는 집안일을 해 행복도를 올려줄 수 있어요.
      </Text>

      <View style={ styles.previewContainer }>
        <Mascot
          config={ { earStyle: earVariant, tailStyle: tailVariant, fillColor } }
          action="idle"
          size={ 180 }
        />
      </View>

      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <View style={ styles.editorContainer }>
        <MascotStyleEditor
          earStyle={ earStyle }
          tailStyle={ tailStyle }
          fillColor={ fillColor }
          onChangeEarStyle={ setEarStyle }
          onChangeTailStyle={ setTailStyle }
          onChangeFillColor={ setFillColor }
        />
      </View>

      <Pressable
        style={ styles.submitButton }
        onPress={ onSubmit }
        disabled={ isSaving }
      >
        {
          isSaving
          ? <ActivityIndicator color="#fff" />
          : <Text style={ styles.submitButtonText }> 마스코트 만들기 </Text>
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
  logoutLink: {
    position: "absolute",
    right: 16,
  },
  logoutLinkText: {
    color: "#555",
    fontSize: 13,
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: "700",
    color: commonColor.touchable,
    marginTop: 40,
    marginBottom: 4,
    textAlign: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  error: {
    color: "#d32f2f",
    marginBottom: 12,
    textAlign: "center",
  },
  editorContainer: {
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: "auto",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default MascotSetup;
