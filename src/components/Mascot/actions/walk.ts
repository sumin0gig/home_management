import {
  Easing,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { loopPair } from "../animations/loopPair";
import { EYE_RADIUS } from "../parts/Eye";
import type { ActionDefinition, ActionRunner } from "./types";

const PX_SCALE = 220 / 640;

const run: ActionRunner = values => {
  const linear = Easing.linear;
  const sine = Easing.inOut( Easing.sin );

  loopPair( values.legPairABounce, values.legPairBBounce, {
    holdMs: 0,
    delayMs: 220,
    steps: [
      { to: -11 * PX_SCALE, duration: 220, easing: linear },
      { to: 0, duration: 220, easing: linear },
    ],
  } );

  values.headBob.value = withRepeat(
    withSequence(
      withTiming( -4 * PX_SCALE, { duration: 220, easing: sine } ),
      withTiming( 0, { duration: 220, easing: sine } ),
    ),
    -1,
  );

  values.bodyBreath.value = withRepeat(
    withSequence(
      withTiming( -0.015, { duration: 220, easing: sine } ),
      withTiming( 0, { duration: 220, easing: sine } ),
    ),
    -1,
  );

  values.tailWag.value = withRepeat(
    withSequence(
      withTiming( 14, { duration: 380, easing: linear } ),
      withTiming( -12, { duration: 380, easing: linear } ),
    ),
    -1,
  );

  const EYE_BLINK_CLOSED = 0.84 - EYE_RADIUS;

  loopPair( values.eyeLBlink, values.eyeRBlink, {
    holdMs: 4140,
    delayMs: 120,
    steps: [
      { to: EYE_BLINK_CLOSED, duration: 184, easing: sine },
      { to: 0, duration: 276, easing: sine },
    ],
  } );
};

const walk: ActionDefinition = { run };

export default walk;
