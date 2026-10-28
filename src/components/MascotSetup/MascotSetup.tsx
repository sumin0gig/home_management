import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Mascot from "../Mascot/Mascot";
import MascotStyleEditor from "../Mascot/MascotStyleEditor";
import { COLOR_OPTIONS, EAR_OPTIONS, TAIL_OPTIONS } from "../Mascot/optionMaps";
import { useMascotStore, type MascotInput } from "../../store/useMascotStore";
import { useFamilyStore } from "../../store/useFamilyStore";
import OnboardingScaffold from "../Onboarding/OnboardingScaffold";
import OnboardingButton from "../Onboarding/OnboardingButton";
import { colors, commonColor } from "../../styles/commonStyle";

function pickRandom<T>( options: T[], random: () => number ): T {
  return options[Math.floor( random() * options.length )];
}

interface Props {
  // 테스트에서 무작위를 고정한다.
  random?: () => number;
}

function MascotSetup( { random = Math.random }: Props ): React.JSX.Element {
  const error = useMascotStore( state => state.error );
  const createMascot = useMascotStore( state => state.createMascot );
  // 진행 막대: 새로 시작(관리자)은 3/3, 참여는 2/2
  const isOwner = useFamilyStore( state => state.membership?.role === "OWNER" );
  const total = isOwner ? 3 : 2;

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

  const onRandomize = () => {
    setEarStyle( pickRandom( EAR_OPTIONS, random ).value );
    setTailStyle( pickRandom( TAIL_OPTIONS, random ).value );
    setFillColor( pickRandom( COLOR_OPTIONS, random ) );
  };

  const onSubmit = () => {
    setIsSaving( true );
    return createMascot( { earStyle, tailStyle, fillColor } ).finally( () =>
      setIsSaving( false ),
    );
  };

  return (
    <OnboardingScaffold
      progress={ { step: total, total, label: "마스코트" } }
      title={ "함께 지낼\n친구를 꾸며주세요" }
      description="집안일을 할 때마다 이 친구와 추억이 쌓여요."
      footer={
        <OnboardingButton text="이 친구로 할게요" onPress={ onSubmit } loading={ isSaving } />
      }
    >
      { /* 동그라미 배경 없이 마스코트만 크게 */ }
      <View style={ styles.preview } testID="mascot-preview">
        <Mascot
          config={ { earStyle: earVariant, tailStyle: tailVariant, fillColor } }
          action="idle"
          size={ 160 }
        />
      </View>

      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <MascotStyleEditor
        earStyle={ earStyle }
        tailStyle={ tailStyle }
        fillColor={ fillColor }
        onChangeEarStyle={ setEarStyle }
        onChangeTailStyle={ setTailStyle }
        onChangeFillColor={ setFillColor }
      />

      <View style={ styles.randomRow }>
        <OnboardingButton text="아무렇게나 골라줘" variant="link" onPress={ onRandomize } />
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create( {
  preview: {
    alignItems: "center",
    marginBottom: 20,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
    textAlign: "center",
  },
  randomRow: {
    alignItems: "center",
    marginTop: 8,
  },
} );

export default MascotSetup;
