import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFamilyStore } from "../../store/useFamilyStore";
import OnboardingScaffold from "../Onboarding/OnboardingScaffold";
import OnboardingButton from "../Onboarding/OnboardingButton";
import { colors, commonColor } from "../../styles/commonStyle";
import { JOIN_TOTAL_STEPS, type FamilyOnboardingScreenProps } from "./types";

function JoinConfirmScreen( {
  navigation,
  route,
}: FamilyOnboardingScreenProps<"JoinConfirm"> ): React.JSX.Element {
  const { family, ownerName, memberCount, roomCount } = route.params.lookup;
  const joinFamily = useFamilyStore( state => state.joinFamily );
  const [isJoining, setIsJoining] = React.useState( false );
  const [error, setError] = React.useState<string | null>( null );

  const summary = [
    ownerName ? `관리자 ${ownerName}` : null,
    `구성원 ${memberCount}명`,
    `방 ${roomCount}개`,
  ]
  .filter( Boolean )
  .join( " · " );

  const onJoin = () => {
    setIsJoining( true );
    setError( null );
    return joinFamily( family.id )
    .then( ok => {
      if (!ok) {
        setError( useFamilyStore.getState().error );
      }
    } )
    .finally( () => setIsJoining( false ) );
  };

  return (
    <OnboardingScaffold
      progress={ { step: 1, total: JOIN_TOTAL_STEPS, label: "참여" } }
      title="이 가족에 참여할까요?"
      footer={
        <>
          <OnboardingButton text="참여하기" onPress={ onJoin } loading={ isJoining } />
          <OnboardingButton
            text="다른 코드 입력"
            variant="link"
            onPress={ () => navigation.goBack() }
          />
        </>
      }
    >
      <View style={ styles.card } testID="join-family-card">
        <Text style={ styles.familyName }> { family.name } </Text>
        <Text style={ styles.summary }> { summary } </Text>
      </View>
      <Text style={ styles.description }>
        { `참여하면 ${family.name}의 방과 집안일을 같이 보고 할 수 있어요.` }
      </Text>
      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create( {
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    backgroundColor: colors.white,
    gap: 6,
  },
  familyName: {
    fontSize: 21,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  summary: {
    fontSize: 13,
    color: commonColor.textMuted,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: commonColor.textMuted,
    marginTop: 14,
  },
  error: {
    color: commonColor.error,
    marginTop: 10,
  },
} );

export default JoinConfirmScreen;
