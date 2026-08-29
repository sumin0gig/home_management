import type { ComponentType } from "react";
import type { Pivot, TailVariant, TailVariantProps } from "../../types";
import StraightTail, { pivot as straightPivot } from "./StraightTail";
import CurlyTail, { pivot as curlyPivot } from "./CurlyTail";

export const TAIL_VARIANTS: Record<
  TailVariant,
  ComponentType<TailVariantProps>
> = {
  straight: StraightTail,
  curly: CurlyTail,
};

export const TAIL_PIVOTS: Record<TailVariant, Pivot> = {
  straight: straightPivot,
  curly: curlyPivot,
};
