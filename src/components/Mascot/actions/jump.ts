import {
  Easing,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ActionDefinition, ActionRunner } from "./types";

const SQUASH_ANTICIPATION_MS = 90;
const SQUASH_RISE_MS = 160;
const SQUASH_FALL_MS = 100;
const SQUASH_SETTLE_MS = 140;
const JUMP_DURATION_MS =
  SQUASH_ANTICIPATION_MS + SQUASH_RISE_MS + SQUASH_FALL_MS + SQUASH_SETTLE_MS;

const run: ActionRunner = values => {
  values.squashX.value = withSequence(
    withTiming( 1.15, { duration: SQUASH_ANTICIPATION_MS } ),
    withTiming( 0.92, { duration: SQUASH_RISE_MS } ),
    withTiming( 1.12, { duration: SQUASH_FALL_MS } ),
    withTiming( 1, { duration: SQUASH_SETTLE_MS } ),
  );
  values.squashY.value = withSequence(
    withTiming( 0.85, { duration: SQUASH_ANTICIPATION_MS } ),
    withTiming( 1.08, { duration: SQUASH_RISE_MS } ),
    withTiming( 0.88, { duration: SQUASH_FALL_MS } ),
    withTiming( 1, { duration: SQUASH_SETTLE_MS } ),
  );
  values.jumpY.value = withSequence(
    withDelay(
      SQUASH_ANTICIPATION_MS,
      withTiming( -34, { duration: 160, easing: Easing.out( Easing.quad ) } ),
    ),
    withTiming( 0, { duration: 160, easing: Easing.in( Easing.quad ) } ),
  );
};

const jump: ActionDefinition = { run, duration: JUMP_DURATION_MS };

export default jump;
