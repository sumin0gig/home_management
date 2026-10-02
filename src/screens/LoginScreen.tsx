import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  getAuthErrorMessage,
  openPrivacyPolicy,
  signInWithGoogle,
} from "../../actions";
import { colors, commonColor } from "../styles/commonStyle";
import DefaultButton from "../components/common/DefaultButton";

function LoginScreen(): React.JSX.Element {
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
    <View style={ styles.container }>
      <Text style={ styles.title }> HomeManagement </Text>
      <Text style={ styles.description }> Google 계정으로 로그인해주세요. </Text>

      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }

      <DefaultButton
        text="Google로 로그인"
        onPress={ onGoogleSignIn }
        style={ styles.button }
        textStyle={ styles.buttonText }
      />

      <Pressable onPress={ onOpenPrivacyPolicy } style={ styles.policyLink }>
        <Text style={ styles.policyLinkText }> 개인정보처리방침 </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: commonColor.backgroundColor,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 24,
  },
  error: {
    color: commonColor.error,
    marginBottom: 12,
  },
  button: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  policyLink: {
    marginTop: 16,
    padding: 8,
  },
  policyLinkText: {
    fontSize: 13,
    color: colors.darkGray,
    textDecorationLine: "underline",
  },
} );

export default LoginScreen;
