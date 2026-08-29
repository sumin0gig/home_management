import { useSharedValue } from "react-native-reanimated";
import type { MascotSharedValues } from "../actions/types";

export function useMascotSharedValues(): MascotSharedValues {
  return {
    jumpY: useSharedValue( 0 ),
    squashX: useSharedValue( 1 ),
    squashY: useSharedValue( 1 ),
    headBob: useSharedValue( 0 ),
    bodyBreath: useSharedValue( 1 ),
    earLTwitch: useSharedValue( 0 ),
    earRTwitch: useSharedValue( 0 ),
    eyeLBlink: useSharedValue( 7 ),
    eyeRBlink: useSharedValue( 7 ),
    tailWag: useSharedValue( 0 ),
    frontLegsBounce: useSharedValue( 0 ),
    backLegsBounce: useSharedValue( 0 ),
  };
}
