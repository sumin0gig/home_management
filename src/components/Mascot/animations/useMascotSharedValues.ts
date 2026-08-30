import { useSharedValue } from "react-native-reanimated";
import type { MascotSharedValues } from "../actions/types";

export function useMascotSharedValues(): MascotSharedValues {
  return {
    jumpY: useSharedValue( 0 ),
    squashX: useSharedValue( 0 ),
    squashY: useSharedValue( 0 ),
    headBob: useSharedValue( 0 ),
    bodyBreath: useSharedValue( 0 ),
    earLTwitch: useSharedValue( 0 ),
    earRTwitch: useSharedValue( 0 ),
    eyeLBlink: useSharedValue( 0 ),
    eyeRBlink: useSharedValue( 0 ),
    tailWag: useSharedValue( 0 ),
    legPairABounce: useSharedValue( 0 ),
    legPairBBounce: useSharedValue( 0 ),
  };
}
