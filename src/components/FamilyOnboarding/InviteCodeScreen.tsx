import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFamilyStore } from "../../store/useFamilyStore";
import OnboardingScaffold from "../Onboarding/OnboardingScaffold";
import OnboardingButton from "../Onboarding/OnboardingButton";
import { commonColor } from "../../styles/commonStyle";
import CodeBoxesInput, { INVITE_CODE_LENGTH } from "./CodeBoxesInput";
import { JOIN_TOTAL_STEPS, type FamilyOnboardingScreenProps } from "./types";

export const CODE_NOT_FOUND_MESSAGE =
  "코드를 다시 확인해주세요. 대문자와 숫자 6자리예요.";

function InviteCodeScreen( {
  navigation,
}: FamilyOnboardingScreenProps<"InviteCode"> ): React.JSX.Element {
  const lookupFamilyByCode = useFamilyStore( state => state.lookupFamilyByCode );
  const [code, setCode] = React.useState( "" );
  const [isChecking, setIsChecking] = React.useState( false );
  const [error, setError] = React.useState<string | null>( null );
  const isComplete = code.length === INVITE_CODE_LENGTH;

  // 찾기만 하고 바로 참여하지 않는다 — 참여 확인 화면에서 어떤 가족인지 보여준다.
  const check = (value: string) => {
    if (value.length !== INVITE_CODE_LENGTH || isChecking) {
      return;
    }
    setIsChecking( true );
    setError( null );
    return lookupFamilyByCode( value )
    .then( lookup =>
      lookup
        ? navigation.navigate( "JoinConfirm", { lookup } )
        : setError( useFamilyStore.getState().error ?? CODE_NOT_FOUND_MESSAGE ),
    )
    .finally( () => setIsChecking( false ) );
  };

  // 6자가 되면 자동으로 확인한다.
  const onChange = (value: string) => {
    setCode( value );
    setError( null );
    if (value.length === INVITE_CODE_LENGTH && value !== code) {
      check( value );
    }
  };

  return (
    <OnboardingScaffold
      progress={ { step: 1, total: JOIN_TOTAL_STEPS, label: "초대 코드" } }
      title="초대 코드를 입력해주세요"
      description="가족에게 받은 6자리 코드예요."
      footer={
        <OnboardingButton
          text="확인"
          onPress={ () => check( code ) }
          disabled={ !isComplete }
          loading={ isChecking }
        />
      }
    >
      <CodeBoxesInput value={ code } onChange={ onChange } hasError={ !!error } />
      {
        error
        ? <Text style={ styles.error } accessibilityLiveRegion="polite">
            { error }
          </Text>
        : null
      }
      <View style={ styles.qrButton }>
        <OnboardingButton
          text="QR 코드로 참여하기"
          variant="secondary"
          onPress={ () => navigation.navigate( "ScanFamilyQr" ) }
        />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create( {
  error: {
    color: commonColor.error,
    fontSize: 13,
    marginTop: 10,
  },
  qrButton: {
    marginTop: 24,
  },
} );

export default InviteCodeScreen;
