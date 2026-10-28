import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getAuthErrorMessage,
  openPrivacyPolicy,
  signInWithGoogle,
} from "../../actions";
import { HOUSE_PRESETS } from "../store/housePresets";
import FloorPlanIllustration from "../components/Onboarding/FloorPlanIllustration";
import { colors, commonColor } from "../styles/commonStyle";

function LoginScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [error, setError] = React.useState<string | null>( null );

  const onGoogleSignIn = () => {
    setError( null );
    return signInWithGoogle().catch( err => setError( getAuthErrorMessage( err ) ) );
  };

  const onOpenPrivacyPolicy = () =>
    openPrivacyPolicy().catch( () =>
      setError( "개인정보처리방침을 열 수 없습니다." ),
    );

  return (
    <View style={ [styles.screen, { paddingTop: insets.top + 40 }] }>
      <Text style={ styles.title } accessibilityRole="header">
        집안일을 정리해요
      </Text>
      <Text style={ styles.description }>
        방마다 할 일을 정리하고 가족과 나눠서 해요. 하나씩 끝낼 때마다 마스코트와
        추억이 쌓여요.
      </Text>

      <View style={ styles.illustration }>
        <FloorPlanIllustration rooms={ HOUSE_PRESETS.two.rooms } fill="white" />
      </View>

      <View style={ [styles.footer, { paddingBottom: insets.bottom + 16 }] }>
        {
          error
          ? <Text style={ styles.error }> { error } </Text>
          : null
        }
        { /* Google 공식 로고 리소스를 넣기 전까지는 글자만 있는 흰 버튼 */ }
        <Pressable
          style={ ({ pressed }) => [
            styles.googleButton,
            pressed && styles.googleButtonPressed,
          ] }
          onPress={ onGoogleSignIn }
          accessibilityRole="button"
        >
          <Text style={ styles.googleButtonText }> Google로 계속하기 </Text>
        </Pressable>
        <Text style={ styles.policy }>
          계속하면{ " " }
          <Text
            style={ styles.policyLink }
            onPress={ onOpenPrivacyPolicy }
            accessibilityRole="link"
          >
            개인정보처리방침
          </Text>
          에 동의하게 돼요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create( {
  screen: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: colors.default,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: commonColor.textDefault,
    marginBottom: 10,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 20,
    color: commonColor.textMuted,
  },
  illustration: {
    marginTop: 32,
  },
  footer: {
    marginTop: "auto",
    gap: 12,
  },
  error: {
    color: commonColor.error,
    textAlign: "center",
  },
  googleButton: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#747775",
  },
  googleButtonPressed: {
    backgroundColor: colors.lightGray,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F1F1F",
  },
  policy: {
    fontSize: 12,
    color: commonColor.textMuted,
    textAlign: "center",
  },
  policyLink: {
    textDecorationLine: "underline",
  },
} );

export default LoginScreen;
