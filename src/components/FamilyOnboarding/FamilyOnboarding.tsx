import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ensureUserExists, signOutUser } from "../../../actions";
import StartupScreen from "../Onboarding/StartupScreen";
import OnboardingButton from "../Onboarding/OnboardingButton";
import { colors, commonColor } from "../../styles/commonStyle";
import ChooseScreen from "./ChooseScreen";
import FamilyNameScreen from "./FamilyNameScreen";
import InviteCodeScreen from "./InviteCodeScreen";
import JoinConfirmScreen from "./JoinConfirmScreen";
import ScanFamilyQrScreen from "./ScanFamilyQrScreen";
import type { FamilyOnboardingParamList } from "./types";

const Stack = createNativeStackNavigator<FamilyOnboardingParamList>();

// 가족이 없을 때의 시작 흐름 (고르기 → 만들기 / 참여하기). 처음 들어올 때
// 사용자 정보를 등록(ensureUserExists)하는 동안은 시작 화면을 보여준다.
function FamilyOnboarding(): React.JSX.Element {
  const [isBootstrapping, setIsBootstrapping] = React.useState( true );
  const [bootstrapError, setBootstrapError] = React.useState<string | null>(
    null,
  );
  const [attempt, setAttempt] = React.useState( 0 );

  React.useEffect( () => {
    let cancelled = false;
    setIsBootstrapping( true );
    setBootstrapError( null );
    ensureUserExists()
    .catch( () => {
      if (!cancelled) {
        setBootstrapError(
          "사용자 정보를 등록하지 못했습니다. 다시 시도해주세요.",
        );
      }
    } )
    .finally( () => {
      if (!cancelled) {
        setIsBootstrapping( false );
      }
    } );
    return () => {
      cancelled = true;
    };
  }, [attempt] );

  if (isBootstrapping) {
    return <StartupScreen />;
  }

  if (bootstrapError) {
    return (
      <View style={ styles.errorScreen }>
        <Text style={ styles.errorText }> { bootstrapError } </Text>
        <OnboardingButton text="다시 시도" onPress={ () => setAttempt( a => a + 1 ) } />
        <OnboardingButton
          text="다른 계정으로 로그인"
          variant="link"
          onPress={ () => signOutUser() }
        />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Choose"
      screenOptions={ {
        headerShown: false,
        contentStyle: { backgroundColor: colors.default },
      } }
    >
      <Stack.Screen name="Choose" component={ ChooseScreen } />
      <Stack.Screen name="FamilyName" component={ FamilyNameScreen } />
      <Stack.Screen name="InviteCode" component={ InviteCodeScreen } />
      <Stack.Screen name="ScanFamilyQr" component={ ScanFamilyQrScreen } />
      <Stack.Screen name="JoinConfirm" component={ JoinConfirmScreen } />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create( {
  errorScreen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: colors.default,
  },
  errorText: {
    color: commonColor.error,
    textAlign: "center",
    marginBottom: 8,
  },
} );

export default FamilyOnboarding;
