import { useMascotStore } from "../../store/useMascotStore";
import { EAR_OPTIONS, TAIL_OPTIONS } from "./optionMaps";
import type { MascotConfig } from "./types";

// 저장된 마스코트 row를 화면에서 쓰는 MascotConfig로 변환한다. 마스코트가
// 아직 없으면 null.
export function useMascotConfig(): MascotConfig | null {
  const mascot = useMascotStore( state => state.mascot );

  if (!mascot) {
    return null;
  }

  return {
    earStyle:
      EAR_OPTIONS.find( option => option.value === mascot.earStyle )?.variant ??
      "round",
    tailStyle:
      TAIL_OPTIONS.find( option => option.value === mascot.tailStyle )
        ?.variant ?? "straight",
    fillColor: mascot.fillColor ?? undefined,
  };
}
