import {
  Easing,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { loopPair } from "../animations/loopPair";
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

  // earL/earR aren't an exact mirror (9,-5,3 vs -10,5,-3 — hand-tuned per
  // side, not a scalar flip), so B gets its own explicit steps rather than a
  // shared shape.
  loopPair( values.earLTwitch, values.earRTwitch, {
    holdMs: 4680,
    delayMs: 1600,
    steps: [
      { to: -10, duration: 300, easing: sine },
      { to: 5, duration: 300, easing: sine },
      { to: -3, duration: 300, easing: sine },
      { to: 0, duration: 420, easing: sine },
    ],
    stepsB: [
      { to: 9, duration: 300, easing: sine },
      { to: -5, duration: 300, easing: sine },
      { to: 3, duration: 300, easing: sine },
      { to: 0, duration: 420, easing: sine },
    ],
  } );

  const EYE_BLINK_CLOSED = 0.84 - EYE_RADIUS;

  loopPair( values.eyeLBlink, values.eyeRBlink, {
    holdMs: 4140,
    delayMs: 120,
    steps: [
      { to: EYE_BLINK_CLOSED, duration: 184, easing: sine },
      { to: 0, duration: 276, easing: sine },
    ],
  } );

  values.tailWag.value = withRepeat(
    withSequence(
      withTiming( 11, { duration: 850, easing: Easing.linear } ),
      withTiming( -9, { duration: 850, easing: Easing.linear } ),
    ),
    -1,
  );

  loopPair( values.legPairABounce, values.legPairBBounce, {
    holdMs: 0,
    delayMs: 1100,
    steps: [
      { to: -5 * PX_SCALE, duration: 1100, easing: Easing.linear },
      { to: 0, duration: 1100, easing: Easing.linear },
    ],
  } );
};

const idle: ActionDefinition = { run };

export default idle;
