import { useMascotStore } from "../../store/useMascotStore";
import {
  computeHappinessLevel,
  type HappinessLevel,
} from "../../utils/happiness";

// 저장된 마스코트의 추억(DB 필드명은 happiness)을 레벨/게이지로 변환한다.
// 마스코트가 아직 없으면 null.
export function useMascotLevel(): HappinessLevel | null {
  const happiness = useMascotStore( state => state.mascot?.happiness );
  const hasMascot = useMascotStore( state => state.mascot != null );

  if (!hasMascot) {
    return null;
  }

  return computeHappinessLevel( happiness ?? 0 );
}
