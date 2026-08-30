import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { commonColor } from "../../styles/commonStyle";

function MascotSetup(): React.JSX.Element {
  return (
    <View style={ styles.container }>
      <Text style={ styles.title }> 마스코트 만들기 </Text>
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
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default MascotSetup;
