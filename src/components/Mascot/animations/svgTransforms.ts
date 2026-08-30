import type { TransformsStyle } from "react-native";

type Transform = Exclude<
  NonNullable<TransformsStyle["transform"]>,
  string
>[number];

/**
 * react-native-svg's <G> x/y/rotation convenience props are JS-render-time
 * only — react-native-svg's own extractTransform bakes them into a matrix
 * during a normal React render. Reanimated's per-frame native setNativeProps
 * update bypasses that render pass entirely, so animating x/y/rotation via
 * animatedProps silently does nothing. Always animate the real native
 * transform prop instead, as an RN-style array.
 *
 * rotate must be a string with a unit suffix ("10deg") — a bare number, or
 * an SVG-syntax transform STRING for the whole transform prop, both crash
 * native RNSVGGroupManagerDelegate.setProperty ("String cannot be cast to
 * ReadableArray").
 *
 * These are called from inside `useAnimatedProps` worklets, which run on the
 * UI thread — Reanimated only auto-workletizes the callback passed directly
 * to `useAnimatedProps` itself, not helper functions imported from another
 * module, so each one needs its own `"worklet"` directive or Reanimated
 * throws "Tried to synchronously call a non-worklet function" at runtime.
 */
export const translateY = (v: number): Transform[] => {
  "worklet";
  return [{ translateY: v }];
};

export const rotateDeg = (v: number): Transform[] => {
  "worklet";
  return [{ rotate: `${v}deg` }];
};

export const scaleXY = (x: number, y: number): Transform[] => {
  "worklet";
  return [{ scaleX: x }, { scaleY: y }];
};
