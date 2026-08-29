import {
  Easing,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import type { ActionDefinition } from "./types";

const jump: ActionDefinition = values => {
  values.squashX.value = withSequence(
    withTiming( 1.15, { duration: 90 } ),
    withTiming( 0.92, { duration: 160 } ),
    withTiming( 1.12, { duration: 100 } ),
    withTiming( 1, { duration: 140 } ),
  );
  values.squashY.value = withSequence(
    withTiming( 0.85, { duration: 90 } ),
    withTiming( 1.08, { duration: 160 } ),
    withTiming( 0.88, { duration: 100 } ),
    withTiming( 1, { duration: 140 } ),
  );
  values.jumpY.value = withSequence(
    withDelay(
      90,
      withTiming( -34, { duration: 160, easing: Easing.out( Easing.quad ) } ),
    ),
    withTiming( 0, { duration: 160, easing: Easing.in( Easing.quad ) } ),
  );
};

export default jump;
