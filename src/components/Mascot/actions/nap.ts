import {
  Easing,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { EYE_RADIUS } from "../parts/Eye";
import type { ActionDefinition, ActionRunner } from "./types";

const PX_SCALE = 220 / 640;

const NAP_CLOSE_MS = 300;
const NAP_HOLD_MS = 3400;
const NAP_OPEN_MS = 300;
const NAP_DURATION_MS = NAP_CLOSE_MS + NAP_HOLD_MS + NAP_OPEN_MS;

const BREATH_HALF_MS = 1000;
const BREATH_COUNT = NAP_DURATION_MS / (BREATH_HALF_MS * 2);

// 눈을 감고 머리를 떨군 채 천천히 숨을 쉬다가 눈을 뜬다. 꼬리는 멈춘다.
const run: ActionRunner = values => {
  const sine = Easing.inOut( Easing.sin );
  const holdAt = ( to: number ) =>
    withSequence(
      withTiming( to, { duration: NAP_CLOSE_MS, easing: sine } ),
      withTiming( to, { duration: NAP_HOLD_MS } ),
      withTiming( 0, { duration: NAP_OPEN_MS, easing: sine } ),
    );

  const EYE_BLINK_CLOSED = 0.84 - EYE_RADIUS;
  values.eyeLBlink.value = holdAt( EYE_BLINK_CLOSED );
  values.eyeRBlink.value = holdAt( EYE_BLINK_CLOSED );
  values.headBob.value = holdAt( 6 * PX_SCALE );
  values.tailWag.value = withTiming( 0, { duration: NAP_CLOSE_MS } );

  values.bodyBreath.value = withRepeat(
    withSequence(
      withTiming( 0.03, { duration: BREATH_HALF_MS, easing: sine } ),
      withTiming( 0, { duration: BREATH_HALF_MS, easing: sine } ),
    ),
    BREATH_COUNT,
  );
};

const nap: ActionDefinition = { run, duration: NAP_DURATION_MS };

export default nap;
