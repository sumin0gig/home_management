import { Easing, withSequence, withTiming } from "react-native-reanimated";
import { EYE_RADIUS } from "../parts/Eye";
import type { ActionDefinition, ActionRunner } from "./types";

const PX_SCALE = 220 / 640;

const STRETCH_IN_MS = 500;
const STRETCH_HOLD_MS = 700;
const STRETCH_OUT_MS = 400;
const STRETCH_DURATION_MS = STRETCH_IN_MS + STRETCH_HOLD_MS + STRETCH_OUT_MS;

// 몸을 옆으로 길게, 위아래로 납작하게 늘이며 머리를 숙이고 눈을 감았다가
// 원래대로 돌아온다. root 스케일 pivot이 바닥 중앙이라 발은 땅에 붙어 있다.
const run: ActionRunner = values => {
  const sine = Easing.inOut( Easing.sin );
  const stretchTo = ( to: number ) =>
    withSequence(
      withTiming( to, { duration: STRETCH_IN_MS, easing: sine } ),
      withTiming( to, { duration: STRETCH_HOLD_MS } ),
      withTiming( 0, { duration: STRETCH_OUT_MS, easing: sine } ),
    );

  values.squashX.value = stretchTo( 0.14 );
  values.squashY.value = stretchTo( -0.12 );
  values.headBob.value = stretchTo( 8 * PX_SCALE );
  values.tailWag.value = stretchTo( 18 );

  const EYE_BLINK_CLOSED = 0.84 - EYE_RADIUS;
  values.eyeLBlink.value = stretchTo( EYE_BLINK_CLOSED );
  values.eyeRBlink.value = stretchTo( EYE_BLINK_CLOSED );
};

const stretch: ActionDefinition = { run, duration: STRETCH_DURATION_MS };

export default stretch;
