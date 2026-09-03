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

export type MascotAction = "idle" | "jump" | "walk";
