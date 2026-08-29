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

export type ActionRunner = (values: MascotSharedValues) => void;

export interface ActionDefinition {
  run: ActionRunner;
  /**
   * Playback duration in ms for one-shot actions — Mascot auto-reverts to
   * "idle" after this many ms. Omit for actions that loop forever (idle
   * itself).
   */
  duration?: number;
}
