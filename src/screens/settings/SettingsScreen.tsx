import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { signOutUser, getAuthErrorMessage } from "../../api/auth";
import { colors, commonColor } from "../../styles/commonStyle";
import DefaultButton from "../../components/common/DefaultButton";

function SettingsScreen(): React.JSX.Element {
  const [error, setError] = React.useState<string | null>( null );

  const onSignOut = async () => {
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
        onPress={ onSignOut }
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
} );

export default SettingsScreen;
