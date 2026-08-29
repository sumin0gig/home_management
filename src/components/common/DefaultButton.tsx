import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { commonColor } from "../../styles/commonStyle";

interface Props {
  text: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function DefaultButton( {
  text,
  onPress,
  style,
  textStyle,
}: Props ): React.JSX.Element {
  return (
    <Pressable style={ [styles.button, style] } onPress={ onPress }>
      <Text style={ [styles.text, textStyle] }> { text } </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  button: {
    backgroundColor: commonColor.touchable,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
} );

export default DefaultButton;
