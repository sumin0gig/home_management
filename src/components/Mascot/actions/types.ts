import type { SharedValue } from "react-native-reanimated";

export interface MascotSharedValues {
  jumpY: SharedValue<number>;
  squashX: SharedValue<number>;
  squashY: SharedValue<number>;
  headBob: SharedValue<number>;
  bodyBreath: SharedValue<number>;
  earLTwitch: SharedValue<number>;
  earRTwitch: SharedValue<number>;
  eyeLBlink: SharedValue<number>;
  eyeRBlink: SharedValue<number>;
  tailWag: SharedValue<number>;
  frontLegsBounce: SharedValue<number>;
  backLegsBounce: SharedValue<number>;
}

export type ActionDefinition = (values: MascotSharedValues) => void;
