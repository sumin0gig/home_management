import type { SharedValue } from "react-native-reanimated";

export interface MascotSharedValues {
  /** Offset from the root's resting y (0) — added directly, no base to sum. */
  jumpY: SharedValue<number>;
  /** Offset from neutral scale (1) — 0 is undistorted. */
  squashX: SharedValue<number>;
  /** Offset from neutral scale (1) — 0 is undistorted. */
  squashY: SharedValue<number>;
  /** Offset from HEAD_BASE_Y (Mascot.tsx) — 0 is resting position. */
  headBob: SharedValue<number>;
  /** Offset from neutral scale (1) — 0 is undistorted. */
  bodyBreath: SharedValue<number>;
  /** Offset from resting rotation (0deg). */
  earLTwitch: SharedValue<number>;
  /** Offset from resting rotation (0deg). */
  earRTwitch: SharedValue<number>;
  /** Offset from Eye's base radius (EYE_RADIUS in parts/Eye) — 0 is open. */
  eyeLBlink: SharedValue<number>;
  eyeRBlink: SharedValue<number>;
  /** Offset from resting rotation (0deg). */
  tailWag: SharedValue<number>;
  /**
   * Offset from FRONT_LEG_Y / BACK_LEG_Y (Mascot.tsx).
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
