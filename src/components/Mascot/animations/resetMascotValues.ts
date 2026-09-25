import { cancelAnimation } from "react-native-reanimated";
import type { MascotSharedValues } from "../actions/types";

// 진행 중인 모든 애니메이션을 멈추고 delta를 0(휴식 자세)으로 되돌린다.
// 새 행동을 시작하기 전에 호출해서, 이전 행동의 반복 애니메이션(예: walk의
// 다리 루프)이 다음 행동 위에 남지 않게 한다.
export function resetMascotValues( values: MascotSharedValues ): void {
  Object.values( values ).forEach( value => {
    cancelAnimation( value );
    value.value = 0;
  } );
}
