import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { colors, commonColor } from "../../styles/commonStyle";

interface Props {
  text: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "link";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function OnboardingButton( {
  text,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  testID,
}: Props ): React.JSX.Element {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      style={ ({ pressed }) => [
        styles.base,
        styles[variant],
        isDisabled && variant !== "link" && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ] }
      onPress={ onPress }
      disabled={ isDisabled }
      accessibilityRole="button"
      accessibilityState={ { disabled: isDisabled, busy: loading } }
      accessibilityLabel={ text }
      testID={ testID }
    >
      {
        loading
        ? <ActivityIndicator
            color={ variant === "primary" ? colors.white : commonColor.touchable }
          />
        : <Text style={ [styles.text, styles[`${variant}Text`]] }> { text } </Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create( {
  base: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: commonColor.touchable,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.14)",
  },
  link: {
    minHeight: 44,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: commonColor.textDefault,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: commonColor.textMuted,
    textDecorationLine: "underline",
  },
} );

export default OnboardingButton;
