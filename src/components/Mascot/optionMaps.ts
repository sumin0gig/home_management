import type { MascotInput } from "../../store/useMascotStore";
import { colors } from "../../styles/commonStyle";
import type { EarVariant, TailVariant } from "./types";

export const EAR_OPTIONS: Array<{
  value: MascotInput["earStyle"];
  label: string;
  variant: EarVariant;
}> = [
  { value: "ROUND", label: "둥근 귀", variant: "round" },
  { value: "POINTY", label: "뾰족한 귀", variant: "pointy" },
  { value: "FLOPPY", label: "늘어진 귀", variant: "floppy" },
];

export const TAIL_OPTIONS: Array<{
  value: MascotInput["tailStyle"];
  label: string;
  variant: TailVariant;
}> = [
  { value: "STRAIGHT", label: "일자 꼬리", variant: "straight" },
  { value: "CURLY", label: "말린 꼬리", variant: "curly" },
];

export const COLOR_OPTIONS = [
  colors.red,
  colors.yellow,
  colors.yellowGreen,
  colors.green,
  colors.teal,
  colors.blue,
];
