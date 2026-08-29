import {
  Easing,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ActionDefinition } from "./types";

const idle: ActionDefinition = values => {
  const sine = Easing.inOut( Easing.sin );

  values.headBob.value = withRepeat(
    withSequence(
      withTiming( -4, { duration: 1600, easing: sine } ),
      withTiming( 0, { duration: 1600, easing: sine } ),
    ),
    -1,
  );

  values.bodyBreath.value = withRepeat(
    withSequence(
      withTiming( 1.04, { duration: 1300, easing: sine } ),
      withTiming( 1, { duration: 1300, easing: sine } ),
    ),
    -1,
  );

  values.earLTwitch.value = withRepeat(
    withSequence(
      withTiming( 8, { duration: 160 } ),
      withTiming( 0, { duration: 160 } ),
      withTiming( 0, { duration: 2400 } ),
    ),
    -1,
  );

  values.earRTwitch.value = withDelay(
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

  values.eyeLBlink.value = withRepeat(
    withSequence(
      withTiming( 7, { duration: 4600 } ),
      withTiming( 0.5, { duration: 100 } ),
      withTiming( 7, { duration: 100 } ),
    ),
    -1,
  );

  values.eyeRBlink.value = withDelay(
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

  values.tailWag.value = withRepeat(
    withSequence(
      withTiming( 15, { duration: 850, easing: sine } ),
      withTiming( -15, { duration: 850, easing: sine } ),
    ),
    -1,
    true,
  );

  values.frontLegsBounce.value = withRepeat(
    withSequence(
      withTiming( -5, { duration: 300 } ),
      withTiming( 0, { duration: 300 } ),
    ),
    -1,
  );

  values.backLegsBounce.value = withDelay(
    300,
    withRepeat(
      withSequence(
        withTiming( -5, { duration: 300 } ),
        withTiming( 0, { duration: 300 } ),
      ),
      -1,
    ),
  );
};

export default idle;
