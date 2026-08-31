import React, { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Mascot from "./Mascot";
import type { MascotConfig } from "./types";

// Mascot's own <Svg> renders at width=size, height=size*(200/280) (its
// viewBox aspect ratio) — using `size` for both axes here would leave the
// wander area under-using its vertical space.
const MASCOT_ASPECT_RATIO = 200 / 280;

const MIN_LEG_MS = 2500;
const MAX_LEG_MS = 5000;
const PX_PER_MS = 0.05; // duration scales with travel distance, not fixed

interface Props {
  config: MascotConfig;
  bounds: { width: number; height: number };
  size?: number;
  onPress?: () => void;
}

function WanderingMascot( {
  config,
  bounds,
  size = 100,
  onPress,
}: Props ): React.JSX.Element {
  const x = useSharedValue( 0 );
  const y = useSharedValue( 0 );
  const facingLeft = useSharedValue( false );

  useEffect( () => {
    const mascotHeight = size * MASCOT_ASPECT_RATIO;
    if (bounds.width <= size || bounds.height <= mascotHeight) {
      return;
    }

    let cancelled = false;

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
            runOnJS( step )();
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.width, bounds.height, size] );

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
        <Mascot config={ config } action="idle" size={ size } />
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
