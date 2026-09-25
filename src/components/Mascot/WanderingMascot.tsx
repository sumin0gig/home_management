import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Mascot from "./Mascot";
import type { MascotAction, MascotConfig } from "./types";

// Mascot's own <Svg> renders at width=size, height=size*(200/280) (its
// viewBox aspect ratio) — using `size` for both axes here would leave the
// wander area under-using its vertical space.
const MASCOT_ASPECT_RATIO = 200 / 280;

const MIN_LEG_MS = 3800;
const MAX_LEG_MS = 5000;
const PX_PER_MS = 0.05; // duration scales with travel distance, not fixed

// 목적지에 도착할 때마다 이 확률로 멈춰서 행동 하나를 한다.
const ACTION_CHANCE = 0.4;

interface Props {
  config: MascotConfig;
  bounds: { width: number; height: number };
  size?: number;
  /** 목적지 도착 시 랜덤으로 고를 one-shot 행동 목록. 비어 있으면 걷기만 한다. */
  actions?: MascotAction[];
  onPress?: () => void;
}

function WanderingMascot( {
  config,
  bounds,
  size = 100,
  actions = [],
  onPress,
}: Props ): React.JSX.Element {
  const x = useSharedValue( 0 );
  const y = useSharedValue( 0 );
  const facingLeft = useSharedValue( false );
  const [action, setAction] = useState<MascotAction>( "walk" );

  // 걷기 루프는 bounds/size가 바뀔 때만 다시 시작되므로, 그 사이 개방된
  // 행동이 바뀌어도 루프를 재시작하지 않고 최신 목록을 읽도록 ref로 보관.
  const actionsRef = useRef( actions );
  actionsRef.current = actions;
  // 행동이 끝나면 다시 걷기 시작할 함수. 행동 중이 아니면 null.
  const resumeRef = useRef<(() => void) | null>( null );

  useEffect( () => {
    setAction( "walk" );
    const mascotHeight = size * MASCOT_ASPECT_RATIO;
    if (bounds.width <= size || bounds.height <= mascotHeight) {
      return;
    }

    let cancelled = false;

    const arrive = () => {
      if (cancelled) {
        return;
      }
      const pool = actionsRef.current;
      if (pool.length > 0 && Math.random() < ACTION_CHANCE) {
        resumeRef.current = step;
        setAction( pool[Math.floor( Math.random() * pool.length )] );
        return;
      }
      step();
    };

    const step = () => {
      if (cancelled) {
        return;
      }
      const nextX = Math.random() * (bounds.width - size);
      const nextY = Math.random() * (bounds.height - mascotHeight);
      const dx = nextX - x.value;
      const duration = Math.min(
        MAX_LEG_MS,
        Math.max( MIN_LEG_MS, Math.abs( dx ) / PX_PER_MS ),
      );
      facingLeft.value = dx < 0;
      x.value = withTiming(
        nextX,
        { duration, easing: Easing.inOut( Easing.quad ) },
        finished => {
          if (finished) {
            runOnJS( arrive )();
          }
        },
      );
      y.value = withTiming( nextY, {
        duration,
        easing: Easing.inOut( Easing.quad ),
      } );
    };

    step();

    return () => {
      cancelled = true;
      resumeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.width, bounds.height, size] );

  const onActionEnd = () => {
    setAction( "walk" );
    const resume = resumeRef.current;
    resumeRef.current = null;
    resume?.();
  };

  const animatedStyle = useAnimatedStyle( () => ( {
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scaleX: facingLeft.value ? -1 : 1 },
    ],
  } ) );

  return (
    <Animated.View style={ [styles.wrapper, animatedStyle] }>
      <Pressable onPress={ onPress }>
        <Mascot
          config={ config }
          action={ action }
          size={ size }
          onActionEnd={ onActionEnd }
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create( {
  wrapper: {
    position: "absolute",
  },
} );

export default WanderingMascot;
