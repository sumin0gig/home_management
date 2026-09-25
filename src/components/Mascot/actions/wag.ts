import {
  Easing,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ActionDefinition, ActionRunner } from "./types";

// idle.ts와 같은 viewBox 비율 보정 (mascot_rig_demo.html 640px → 우리 220px).
const PX_SCALE = 220 / 640;

const WAG_SWING_MS = 90;
const WAG_COUNT = 6;
const WAG_SETTLE_MS = 150;
const WAG_DURATION_MS = WAG_COUNT * WAG_SWING_MS * 2 + WAG_SETTLE_MS;

// 반가울 때처럼 꼬리를 빠르게 살랑살랑 — idle(850ms 왕복)보다 훨씬 빠르고
// 크게 흔든 뒤 제자리로 돌아온다. 머리도 꼬리 박자에 맞춰 살짝 까딱인다.
const run: ActionRunner = values => {
  const linear = Easing.linear;
  const sine = Easing.inOut( Easing.sin );

  values.tailWag.value = withSequence(
    withRepeat(
      withSequence(
        withTiming( 22, { duration: WAG_SWING_MS, easing: linear } ),
        withTiming( -18, { duration: WAG_SWING_MS, easing: linear } ),
      ),
      WAG_COUNT,
    ),
    withTiming( 0, { duration: WAG_SETTLE_MS, easing: sine } ),
  );

  values.headBob.value = withSequence(
    withRepeat(
      withSequence(
        withTiming( -3 * PX_SCALE, { duration: WAG_SWING_MS, easing: sine } ),
        withTiming( 0, { duration: WAG_SWING_MS, easing: sine } ),
      ),
      WAG_COUNT,
    ),
    withTiming( 0, { duration: WAG_SETTLE_MS } ),
  );
};

const wag: ActionDefinition = { run, duration: WAG_DURATION_MS };

export default wag;
