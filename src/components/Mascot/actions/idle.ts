import {
  Easing,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { EYE_RADIUS } from "../parts/Eye";
import type { ActionDefinition, ActionRunner } from "./types";

// mascot_rig_demo.html uses a 900x640 viewBox; ours is 200x220. Pixel-based
// offsets (bob/bounce) are scaled by that ratio so the motion reads at the
// same proportion on our much smaller canvas. Rotations and scale factors
// are copied as-is since they're already scale-invariant.
const PX_SCALE = 220 / 640;

const run: ActionRunner = values => {
  const sine = Easing.inOut( Easing.sin );

  values.headBob.value = withRepeat(
    withSequence(
      withTiming( -7 * PX_SCALE, { duration: 1600, easing: sine } ),
      withTiming( 0, { duration: 1600, easing: sine } ),
    ),
    -1,
  );

  values.bodyBreath.value = withRepeat(
    withSequence(
      withTiming( 0.035, { duration: 1300, easing: sine } ),
      withTiming( 0, { duration: 1300, easing: sine } ),
    ),
    -1,
  );

  values.earLTwitch.value = withRepeat(
    withSequence(
      withTiming( 0, { duration: 4680, easing: sine } ),
      withTiming( -10, { duration: 300, easing: sine } ),
      withTiming( 5, { duration: 300, easing: sine } ),
      withTiming( -3, { duration: 300, easing: sine } ),
      withTiming( 0, { duration: 420, easing: sine } ),
    ),
    -1,
  );

  values.earRTwitch.value = withDelay(
    1600,
    withRepeat(
      withSequence(
        withTiming( 0, { duration: 4680, easing: sine } ),
        withTiming( 9, { duration: 300, easing: sine } ),
        withTiming( -5, { duration: 300, easing: sine } ),
        withTiming( 3, { duration: 300, easing: sine } ),
        withTiming( 0, { duration: 420, easing: sine } ),
      ),
      -1,
    ),
  );

  const EYE_BLINK_CLOSED = 0.84 - EYE_RADIUS;

  values.eyeLBlink.value = withRepeat(
    withSequence(
      withTiming( 0, { duration: 4140, easing: sine } ),
      withTiming( EYE_BLINK_CLOSED, { duration: 184, easing: sine } ),
      withTiming( 0, { duration: 276, easing: sine } ),
    ),
    -1,
  );

  values.eyeRBlink.value = withDelay(
    120,
    withRepeat(
      withSequence(
        withTiming( 0, { duration: 4140, easing: sine } ),
        withTiming( EYE_BLINK_CLOSED, { duration: 184, easing: sine } ),
        withTiming( 0, { duration: 276, easing: sine } ),
      ),
      -1,
    ),
  );

  values.tailWag.value = withRepeat(
    withSequence(
      withTiming( 11, { duration: 850, easing: sine } ),
      withTiming( -9, { duration: 850, easing: sine } ),
    ),
    -1,
  );

  values.legPairABounce.value = withRepeat(
    withSequence(
      withTiming( -5 * PX_SCALE, { duration: 1100, easing: sine } ),
      withTiming( 0, { duration: 1100, easing: sine } ),
    ),
    -1,
  );

  values.legPairBBounce.value = withDelay(
    1100,
    withRepeat(
      withSequence(
        withTiming( -5 * PX_SCALE, { duration: 1100, easing: sine } ),
        withTiming( 0, { duration: 1100, easing: sine } ),
      ),
      -1,
    ),
  );
};

const idle: ActionDefinition = { run };

export default idle;
