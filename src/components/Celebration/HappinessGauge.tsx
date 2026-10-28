import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { computeHappinessLevel } from "../../utils/happiness";
import { colors, commonColor } from "../../styles/commonStyle";

// 축하 화면이 뜬 뒤 이만큼 기다렸다가 차오른다.
export const GAUGE_DELAY_MS = 300;
export const GAUGE_FILL_MS = 600;

interface Props {
  // 완료 전·후 추억 총합
  before: number;
  after: number;
}

function ratio( total: number ): number {
  const { gaugeValue, gaugeMax } = computeHappinessLevel( total );
  return gaugeMax > 0 ? gaugeValue / gaugeMax : 0;
}

// "추억 Lv.N  +gain"과 그 아래 막대. 완료 전 값에서 완료 후 값으로 차오르고,
// 레벨이 오르면 끝까지 찼다가 새 레벨에서 다시 시작하며 라벨이 바뀐다.
function HappinessGauge( { before, after }: Props ): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const levelBefore = computeHappinessLevel( before ).level;
  const levelAfter = computeHappinessLevel( after ).level;
  const leveledUp = levelAfter > levelBefore;
  const startRatio = ratio( before );
  const endRatio = ratio( after );
  const gain = after - before;

  const [shownLevel, setShownLevel] = React.useState(
    reduceMotion ? levelAfter : levelBefore,
  );
  const fill = useSharedValue( reduceMotion ? endRatio : startRatio );

  React.useEffect( () => {
    if (reduceMotion) {
      fill.value = endRatio;
      setShownLevel( levelAfter );
      return;
    }
    const easing = Easing.out( Easing.cubic );
    if (!leveledUp) {
      fill.value = withDelay(
        GAUGE_DELAY_MS,
        withTiming( endRatio, { duration: GAUGE_FILL_MS, easing } ),
      );
      return;
    }
    // 끝까지 차는 구간과 새 레벨에서 다시 차는 구간에 시간을 길이만큼 나눈다.
    const firstLeg = 1 - startRatio;
    const total = firstLeg + endRatio || 1;
    const firstMs = Math.round( GAUGE_FILL_MS * (firstLeg / total) );
    const secondMs = GAUGE_FILL_MS - firstMs;
    fill.value = withDelay(
      GAUGE_DELAY_MS,
      withSequence(
        withTiming( 1, { duration: firstMs } ),
        withTiming( 0, { duration: 0 } ),
        withTiming( endRatio, { duration: secondMs, easing } ),
      ),
    );
    const timer = setTimeout(
      () => setShownLevel( levelAfter ),
      GAUGE_DELAY_MS + firstMs,
    );
    return () => clearTimeout( timer );
    // 처음 뜰 때 한 번만 채운다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [] );

  const fillStyle = useAnimatedStyle( () => ( {
    width: `${Math.min( 1, Math.max( 0, fill.value ) ) * 100}%`,
  } ) );

  return (
    <View
      style={ styles.container }
      testID="happiness-gauge"
      accessible
      accessibilityLabel={ `추억 레벨 ${levelAfter}, ${gain} 올랐어요` }
    >
      <View style={ styles.labelRow }>
        <Text style={ styles.level }> { `추억 Lv.${shownLevel}` } </Text>
        <Text style={ styles.gain }> { `+${gain}` } </Text>
      </View>
      <View style={ styles.track }>
        <Animated.View style={ [styles.fill, fillStyle] } />
      </View>
    </View>
  );
}

const styles = StyleSheet.create( {
  container: {
    alignSelf: "stretch",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 6,
  },
  level: {
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.textDefault,
  },
  gain: {
    fontSize: 13,
    fontWeight: "700",
    color: commonColor.touchable,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: commonColor.touchable,
  },
} );

export default HappinessGauge;
