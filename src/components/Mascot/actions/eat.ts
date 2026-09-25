import {
  Easing,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ActionDefinition, ActionRunner } from "./types";

const PX_SCALE = 220 / 640;

const BITE_DOWN_MS = 220;
const BITE_UP_MS = 220;
const BITE_CHEW_MS = 200;
const BITE_COUNT = 3;
const BITE_DEPTH = 48 * PX_SCALE;
const EAT_DURATION_MS = BITE_COUNT * (BITE_DOWN_MS + BITE_UP_MS + BITE_CHEW_MS);

// 밥그릇에 머리를 숙여 한 입 먹고, 고개를 들어 오물거리기를 3번 반복한다.
// 맛있어서 꼬리도 천천히 흔든다.
const run: ActionRunner = values => {
  const sine = Easing.inOut( Easing.sin );

  values.headBob.value = withRepeat(
    withSequence(
      withTiming( BITE_DEPTH, { duration: BITE_DOWN_MS, easing: sine } ),
      withTiming( 0, { duration: BITE_UP_MS, easing: sine } ),
      withTiming( 0, { duration: BITE_CHEW_MS } ),
    ),
    BITE_COUNT,
  );

  // 고개를 든 뒤 오물거리는 동안 몸통이 살짝 들썩인다.
  values.bodyBreath.value = withRepeat(
    withSequence(
      withTiming( 0, { duration: BITE_DOWN_MS + BITE_UP_MS } ),
      withTiming( -0.02, { duration: BITE_CHEW_MS / 2, easing: sine } ),
      withTiming( 0, { duration: BITE_CHEW_MS / 2, easing: sine } ),
    ),
    BITE_COUNT,
  );

  values.tailWag.value = withSequence(
    withRepeat(
      withSequence(
        withTiming( 12, { duration: 320, easing: sine } ),
        withTiming( -10, { duration: 320, easing: sine } ),
      ),
      Math.floor( EAT_DURATION_MS / 640 ),
    ),
    withTiming( 0, { duration: 120 } ),
  );
};

const eat: ActionDefinition = { run, duration: EAT_DURATION_MS };

export default eat;
