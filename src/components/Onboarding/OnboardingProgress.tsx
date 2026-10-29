import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { commonColor } from "../../styles/commonStyle";

interface Props {
  // 0이면 아직 경로(새로 시작 / 참여)를 고르기 전
  step: number;
  total: number;
  label: string;
}

// 처음 시작하는 흐름의 진행 막대. 새로 시작 = 가족 이름(1) → 집(2) → 마스코트(3),
// 참여 = 참여(1) → 마스코트(2).
function OnboardingProgress( { step, total, label }: Props ): React.JSX.Element {
  return (
    <View
      style={ styles.row }
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={ step > 0 ? `${total}단계 중 ${step}단계, ${label}` : label }
      testID="onboarding-progress"
    >
      <View style={ styles.bars }>
        { Array.from( { length: total } ).map( (_, index) => (
          <View
            key={ index }
            testID="onboarding-progress-bar"
            style={ [styles.bar, index < step ? styles.barDone : styles.barTodo] }
          />
        ) ) }
      </View>
      <Text style={ styles.label }> { label } </Text>
    </View>
  );
}

const styles = StyleSheet.create( {
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bars: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  barDone: {
    backgroundColor: commonColor.textDefault,
  },
  barTodo: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  label: {
    fontSize: 11.5,
    fontWeight: "700",
    color: commonColor.textSecondary,
  },
} );

export default OnboardingProgress;
