import type { SharedValue } from "react-native-reanimated";
import {
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface TimingStep {
  to: number;
  duration: number;
  easing?: ( value: number ) => number;
}

interface LoopPairOptions {
  /** Ms to wait (no interpolation scheduled) before each repeat's motion starts. */
  holdMs: number;
  /** The actual motion steps, run after each `holdMs` wait. */
  steps: TimingStep[];
  /** B's steps, if not just `steps` reused verbatim (e.g. ears aren't an exact mirror). */
  stepsB?: TimingStep[];
  /** Ms to wait once, before B's whole repeating loop starts. */
  delayMs: number;
}

/**
 * Drives a pair of shared values with the same repeating "wait, then run a
 * ping-pong sequence" shape — the pattern idle's ears/eyes/legs all share,
 * with B phase-offset from A by `delayMs`.
 */
export function loopPair(
  a: SharedValue<number>,
  b: SharedValue<number>,
  { holdMs, steps, stepsB, delayMs }: LoopPairOptions,
): void {
  const build = ( s: TimingStep[] ) =>
    withRepeat(
      withDelay(
        holdMs,
        withSequence(
          ...s.map( ( { to, duration, easing } ) =>
            withTiming( to, { duration, easing } ),
          ),
        ),
      ),
      -1,
    );

  a.value = build( steps );
  b.value = withDelay( delayMs, build( stepsB ?? steps ) );
}
