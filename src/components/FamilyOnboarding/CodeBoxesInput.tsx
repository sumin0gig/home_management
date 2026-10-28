import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { normalizeInviteCode } from "../../store/useFamilyStore";
import { colors, commonColor } from "../../styles/commonStyle";

export const INVITE_CODE_LENGTH = 6;

interface Props {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

// 보이는 칸 6개 + 실제로는 숨긴 TextInput 하나. 대문자로 바꾸고 영문·숫자만
// 남겨서, 붙여넣기("k7q2-mx" 등)도 그대로 받는다.
function CodeBoxesInput( { value, onChange, hasError = false }: Props ): React.JSX.Element {
  const inputRef = React.useRef<TextInput>( null );
  const [isFocused, setIsFocused] = React.useState( false );

  return (
    <Pressable
      onPress={ () => inputRef.current?.focus() }
      accessible={ false }
      style={ styles.container }
    >
      <View style={ styles.boxes } pointerEvents="none">
        { Array.from( { length: INVITE_CODE_LENGTH } ).map( (_, index) => {
          const isCurrent =
            isFocused &&
            (index === value.length ||
              (value.length === INVITE_CODE_LENGTH && index === INVITE_CODE_LENGTH - 1));
          return (
            <View
              key={ index }
              style={ [
                styles.box,
                isCurrent && styles.boxCurrent,
                hasError && styles.boxError,
              ] }
            >
              <Text style={ styles.char }> { value[index] ?? "" } </Text>
            </View>
          );
        } ) }
      </View>
      <TextInput
        ref={ inputRef }
        testID="invite-code-input"
        style={ styles.hiddenInput }
        value={ value }
        onChangeText={ text =>
          onChange( normalizeInviteCode( text ).slice( 0, INVITE_CODE_LENGTH ) )
        }
        onFocus={ () => setIsFocused( true ) }
        onBlur={ () => setIsFocused( false ) }
        autoCapitalize="characters"
        autoCorrect={ false }
        autoComplete="off"
        keyboardType="visible-password"
        autoFocus
        caretHidden
        accessibilityLabel={ `초대 코드 ${INVITE_CODE_LENGTH}자리` }
      />
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  container: {
    position: "relative",
  },
  boxes: {
    flexDirection: "row",
    gap: 8,
  },
  box: {
    flex: 1,
    aspectRatio: 0.82,
    maxHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  boxCurrent: {
    borderWidth: 2,
    borderColor: commonColor.textDefault,
  },
  boxError: {
    borderColor: commonColor.error,
  },
  char: {
    fontSize: 22,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  // 칸 위에 투명하게 겹쳐서 누르면 키보드가 뜨고 붙여넣기 메뉴도 쓸 수 있게 한다.
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: "transparent",
  },
} );

export default CodeBoxesInput;
