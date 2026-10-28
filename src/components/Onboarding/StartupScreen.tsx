import React from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";

// 앱이 뜨거나 단계 사이에서 불러오는 동안 보여주는 화면. 흰 화면에 스피너만
// 깜빡이지 않도록 Android 시작 화면과 같은 배경(colors.default)에 앱 아이콘을 둔다.
function StartupScreen(): React.JSX.Element {
  return (
    <View
      style={ styles.container }
      testID="startup-screen"
      accessible
      accessibilityLabel="불러오는 중"
    >
      <Image source={ require( "../../../assets/app-icon.png" ) } style={ styles.icon } />
      <ActivityIndicator color={ commonColor.touchable } style={ styles.spinner } />
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.default,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  spinner: {
    marginTop: 20,
  },
} );

export default StartupScreen;
