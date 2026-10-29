import React from "react";
import { StyleSheet, Text, TextInput } from "react-native";
import { useFamilyStore } from "../../store/useFamilyStore";
import OnboardingScaffold from "../Onboarding/OnboardingScaffold";
import OnboardingButton from "../Onboarding/OnboardingButton";
import { colors, commonColor } from "../../styles/commonStyle";
import { CREATE_TOTAL_STEPS } from "./types";

const DEFAULT_FAMILY_NAME = "우리집";

function FamilyNameScreen(): React.JSX.Element {
  const error = useFamilyStore( state => state.error );
  const createFamily = useFamilyStore( state => state.createFamily );
  const [name, setName] = React.useState( DEFAULT_FAMILY_NAME );
  const [isCreating, setIsCreating] = React.useState( false );
  const trimmed = name.trim();

  // "다음" 버튼과 키보드의 다음(엔터)이 같이 쓴다. 빈 값이면 아무것도 안 한다.
  const onNext = () => {
    if (!trimmed || isCreating) {
      return;
    }
    setIsCreating( true );
    return createFamily( trimmed ).finally( () => setIsCreating( false ) );
  };

  return (
    <OnboardingScaffold
      progress={ { step: 1, total: CREATE_TOTAL_STEPS, label: "가족 이름" } }
      title="가족 이름을 정해주세요"
      description="가족에게 보이는 이름이에요. 나중에 바꿀 수 있어요."
      footer={
        <OnboardingButton
          text="다음"
          onPress={ onNext }
          disabled={ !trimmed }
          loading={ isCreating }
        />
      }
    >
      <TextInput
        style={ styles.input }
        value={ name }
        onChangeText={ setName }
        returnKeyType="next"
        onSubmitEditing={ onNext }
        submitBehavior="submit"
        maxLength={ 20 }
        accessibilityLabel="가족 이름"
        autoFocus
      />
      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create( {
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
    backgroundColor: colors.white,
    fontSize: 17,
    color: commonColor.textDefault,
  },
  error: {
    color: commonColor.error,
    marginTop: 10,
  },
} );

export default FamilyNameScreen;
