import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  // radio: 여럿 중 하나만, checkbox: 여러 개 고를 수 있음
  role: "radio" | "checkbox";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

function Chip( {
  label,
  selected,
  onPress,
  role,
  accessibilityLabel,
  style,
}: Props ): React.JSX.Element {
  const textStyle = selected ? styles.textSelected : styles.text;
  return (
    <Pressable
      accessibilityRole={ role }
      accessibilityState={ { checked: selected } }
      accessibilityLabel={ accessibilityLabel }
      style={ [styles.chip, style, selected && styles.chipSelected] }
      onPress={ onPress }
    >
      <Text style={ textStyle }> { label } </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  chip: {
    borderWidth: 1,
    borderColor: commonColor.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: commonColor.touchable,
    borderColor: commonColor.touchable,
  },
  text: {
    color: colors.darkGray,
  },
  textSelected: {
    color: colors.white,
    fontWeight: "600",
  },
} );

export default Chip;
