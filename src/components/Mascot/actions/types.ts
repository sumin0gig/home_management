import type { SharedValue } from "react-native-reanimated";

/**
 * Every field here is a DELTA from a fixed base value owned elsewhere — never
 * an absolute value. Actions only ever assign deltas (0 at rest, per
 * `useMascotSharedValues`); `Mascot.tsx` is the only place that sums
 * base + delta when building `useAnimatedProps`. Each field comment below
 * just names where that base lives.
 */
export interface MascotSharedValues {
  /** Root's resting y (0) — no separate base constant. */
  jumpY: SharedValue<number>;
  /** Neutral scale (1). */
  squashX: SharedValue<number>;
  /** Neutral scale (1). */
  squashY: SharedValue<number>;
  /** HEAD_BASE_Y, Mascot.tsx. */
  headBob: SharedValue<number>;
  /** Neutral scale (1). */
  bodyBreath: SharedValue<number>;
  /** Resting rotation (0deg). */
  earLTwitch: SharedValue<number>;
  /** Resting rotation (0deg). */
  earRTwitch: SharedValue<number>;
  /** EYE_RADIUS, parts/Eye.tsx. */
  eyeLBlink: SharedValue<number>;
  eyeRBlink: SharedValue<number>;
  /** Resting rotation (0deg). */
  tailWag: SharedValue<number>;
  /**
   * FRONT_LEG_Y / BACK_LEG_Y, Mascot.tsx.
   *
   * Diagonal leg pairs (front-left+back-right vs front-right+back-left) bounce
   * in alternating phase, like a resting quadruped's weight shift — NOT the
   * front pair and back pair each bouncing in unison, which reads as a human
   * bouncing on both feet.
   */
  legPairABounce: SharedValue<number>;
  legPairBBounce: SharedValue<number>;
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
