import { useEffect } from "react";
import {
  Easing,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export function useIdleAnimations() {
  const headBob = useSharedValue( 0 );
  const bodyBreath = useSharedValue( 1 );
  const earLTwitch = useSharedValue( 0 );
  const earRTwitch = useSharedValue( 0 );
  const eyeLBlink = useSharedValue( 7 );
  const eyeRBlink = useSharedValue( 7 );
  const tailWag = useSharedValue( 0 );
  const frontLegsBounce = useSharedValue( 0 );
  const backLegsBounce = useSharedValue( 0 );

  useEffect( () => {
    const sine = Easing.inOut( Easing.sin );

    headBob.value = withRepeat(
      withSequence(
        withTiming( -4, { duration: 1600, easing: sine } ),
        withTiming( 0, { duration: 1600, easing: sine } ),
      ),
      -1,
    );

    bodyBreath.value = withRepeat(
      withSequence(
        withTiming( 1.04, { duration: 1300, easing: sine } ),
        withTiming( 1, { duration: 1300, easing: sine } ),
      ),
      -1,
    );

    earLTwitch.value = withRepeat(
      withSequence(
        withTiming( 8, { duration: 160 } ),
        withTiming( 0, { duration: 160 } ),
        withTiming( 0, { duration: 2400 } ),
      ),
      -1,
    );

    earRTwitch.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming( -8, { duration: 160 } ),
          withTiming( 0, { duration: 160 } ),
          withTiming( 0, { duration: 3100 } ),
        ),
        -1,
      ),
    );

    eyeLBlink.value = withRepeat(
      withSequence(
        withTiming( 7, { duration: 4600 } ),
        withTiming( 0.5, { duration: 100 } ),
        withTiming( 7, { duration: 100 } ),
      ),
      -1,
    );

    eyeRBlink.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming( 7, { duration: 4600 } ),
          withTiming( 0.5, { duration: 100 } ),
          withTiming( 7, { duration: 100 } ),
        ),
        -1,
      ),
    );

    tailWag.value = withRepeat(
      withSequence(
        withTiming( 15, { duration: 850, easing: sine } ),
        withTiming( -15, { duration: 850, easing: sine } ),
      ),
      -1,
      true,
    );

    frontLegsBounce.value = withRepeat(
      withSequence(
        withTiming( -5, { duration: 300 } ),
        withTiming( 0, { duration: 300 } ),
      ),
      -1,
    );

    backLegsBounce.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming( -5, { duration: 300 } ),
          withTiming( 0, { duration: 300 } ),
        ),
        -1,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [] );

  return {
    headBob,
    bodyBreath,
    earLTwitch,
    earRTwitch,
    eyeLBlink,
    eyeRBlink,
    tailWag,
    frontLegsBounce,
    backLegsBounce,
  };
}
