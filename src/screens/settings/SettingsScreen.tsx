import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { signOutUser, getAuthErrorMessage } from "../../api/auth";
import { commonColor } from "../../styles/commonStyle";
import DefaultButton from "../../components/common/DefaultButton";

function SettingsScreen(): React.JSX.Element {
  const [error, setError] = React.useState<string | null>( null );

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      setError( getAuthErrorMessage( err ) );
    }
  };

  return (
    <View style={ styles.container }>
      {
        error
        ? <Text style={ styles.error }> { error } </Text>
        : null
      }
      <DefaultButton
        text="로그아웃"
        onPress={ handleSignOut }
        style={ styles.button }
        textStyle={ styles.buttonText }
      />
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
  error: {
    color: "#d32f2f",
    marginBottom: 12,
  },
  button: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default SettingsScreen;
