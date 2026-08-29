import type { ComponentType } from "react";
import type { EarVariant, EarVariantProps, Pivot } from "../../types";
import RoundEar, { pivot as roundPivot } from "./RoundEar";
import PointyEar, { pivot as pointyPivot } from "./PointyEar";
import FloppyEar, { pivot as floppyPivot } from "./FloppyEar";

export const EAR_VARIANTS: Record<
  EarVariant,
  ComponentType<EarVariantProps>
> = {
  round: RoundEar,
  pointy: PointyEar,
  floppy: FloppyEar,
};

export const EAR_PIVOTS: Record<EarVariant, Pivot> = {
  round: roundPivot,
  pointy: pointyPivot,
  floppy: floppyPivot,
};
