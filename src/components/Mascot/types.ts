import type { DefaultAction, UnlockableAction } from "./actionCatalog";

export interface Pivot {
  x: number;
  y: number;
}

export type VariantAnimatedProps = Record<string, unknown>;

export interface EarVariantProps {
  width: number;
  height: number;
  fill: string;
  animatedProps?: VariantAnimatedProps;
}

export type TailVariantProps = EarVariantProps;

export type EarVariant = "round" | "pointy" | "floppy";
export type TailVariant = "straight" | "curly";

export interface MascotConfig {
  earStyle: EarVariant;
  tailStyle: TailVariant;
  fillColor?: string;
}

// idle/walk는 기본 상태, 나머지는 한 번 재생하고 끝나는 행동.
// 행동 목록과 개방 레벨은 actionCatalog.ts 참고.
export type MascotAction = "idle" | "walk" | DefaultAction | UnlockableAction;
