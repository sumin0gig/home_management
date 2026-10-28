# 05. 완료 축하: 가벼운 모달과 오늘 마지막 할 일 축하

> 공통 규칙과 결정된 사항은 `00-README.md`를 따른다. 선행 작업: 03

## 목표

완료하면 항상 축하한다. 평소에는 **마스코트 없이** 문구와 게이지만 있는 작은 시트로 가볍게, 그날의 마지막 할 일을 끝냈을 때만 폭죽이 터지는 전체 화면으로 크게 축하한다. 어떤 축하인지는 03의 집안일 모달이 `variant`로 정해서 넘긴다.

---

## 1단계. 축하 화면 다시 만들기

### 변경 파일
- `src/screens/home/CompleteCheckScreen.tsx`
- `src/navigation/MainNavigator.tsx`, `src/navigation/types.ts`
- `src/components/Mascot/Mascot.tsx` (보이는 영역 지정 prop 추가)
- 새 파일 `src/components/Celebration/Fireworks.tsx`, `src/components/Celebration/HappinessGauge.tsx`
- 새 파일 `src/utils/praise.ts`
- 관련 테스트 (`PRAISE_MESSAGES` 의존 부분 포함)

### 라우트

```ts
CompleteCheck: {
  taskId: string;
  happinessBefore?: number;
  previousDueDate: string;
  variant: 'light' | 'full';
};
```

`Stack.Screen name="CompleteCheck"` 옵션: `presentation: "transparentModal"`, `headerShown: false`, `animation: "fade"`. 화면은 `variant`에 따라 둘 중 하나를 그린다.

### 공통 요소

- **칭찬 문구** — 아래 "칭찬 문구" 절의 `pickPraise`.
- **보조 줄** — "{집안일 이름} 완료".
- **추억 게이지** (`HappinessGauge`) — "추억 Lv.{N}"과 "+{gain}", 그 아래 막대. 화면이 뜬 뒤 300ms 지나서 완료 전 값에서 완료 후 값으로 600ms 동안 차오른다. 레벨이 오르면 끝까지 찼다가 새 레벨에서 다시 시작하고 라벨이 바뀐다.
- **레벨업 카드** — 레벨이 올랐을 때만. 지금의 "레벨 업! / 추억 Lv. A → B / 새로 열린 행동" 내용을 그대로 쓴다.
- **"확인" 버튼** — `goBack()`.
- **"오늘 남은 일 N개" 같은 남은 개수는 보여주지 않는다.**

### `variant: "light"` — 가벼운 모달 (기본)

**마스코트 없이** 글자와 게이지만 있는 작은 시트다.

- 뒤 화면 위에 어두운 막, 아래에서 올라오는 시트 (위쪽 모서리 20, 배경 `colors.default`, 250ms). 높이는 내용만큼.
- 위에서부터: 끌기 손잡이 → **칭찬 문구**(20, 굵게, 왼쪽 정렬, 배경·테두리 없음) → 보조 줄 "{집안일 이름} 완료"(12.5, 보조) → 추억 게이지 → (레벨업 카드) → "확인".
- 칭찬 문구는 시트가 올라온 뒤 살짝 커지며 나타난다 (scale 0.85 → 1, 300ms).
- 막을 누르거나 아래로 끌거나 뒤로 가기를 누르면 닫힌다.
- 폭죽은 없다. `useReducedMotion()`이면 움직임 없이 바로 표시.

### `variant: "full"` — 오늘의 마지막 할 일

불투명한 전체 화면 (배경 `colors.default`).

- **내용 묶음을 화면 세로 가운데에 둔다.** 초상·문구·게이지(·레벨업 카드)를 한 묶음으로, 아래 고정 버튼을 뺀 나머지 공간의 세로 가운데에 놓는다 (`flex: 1`, `justifyContent: "center"`). 위쪽 여백이 남아 휑하게 보이지 않아야 한다.
- **동그란 초상** — 지름 200, 배경은 완료한 집안일의 방 색. `overflow: "hidden"`.
  - 안에 마스코트를 **상반신만** 그린다. `Mascot`에 `viewBox?: { x; y; width; height }` prop을 추가해서 기본 `0 0 280 200` 대신 머리·귀와 몸통 앞부분만 잘라 보여준다. 시작값 `{ x: 40, y: 22, width: 150, height: 150 }`. 다리와 꼬리가 보이지 않고 귀가 잘리지 않도록 에뮬레이터에서 조정한다. 몸통 아래쪽은 원 테두리에서 잘려 나가는 모습이 맞다.
  - 동작은 지금처럼 `happy` → 쉬기 → 반복, 레벨업으로 새로 열린 행동이 있으면 순서대로 섞는다.
- **폭죽** (`Fireworks`, `pointerEvents="none"`, 초상보다 넓은 영역에 절대 위치)
  - 원의 왼쪽 위, 오른쪽 위, 오른쪽 아래 근처에서 0ms, 220ms, 440ms에 세 번 터진다.
  - 한 번 터질 때 입자 14개가 사방으로 퍼지며 작아지고 사라진다 (약 900ms). 지름 5~7의 원과 길이 10의 짧은 선을 섞는다.
  - 색은 `ROOM_COLOR_PALETTE`의 진한 쪽 4개와 `commonColor.touchable`. 방 색과 같은 색만 나오지 않게 한다.
  - 레벨도 올랐으면 1초 뒤 한 번 더, 입자 20개로 크게 터진다.
  - `react-native-reanimated`로 구현한다 (터짐마다 shared value 하나, 입자 위치는 각도로 계산). 화면 전체에 뿌리는 색종이 효과는 넣지 않는다.
  - `useReducedMotion()`이 true면 움직이지 않는 작은 반짝임 몇 개만 원 둘레에 그린다.
- 칭찬 문구 28 굵게, 보조 줄은 "{집안일 이름} 완료 · 오늘 할 일을 모두 끝냈어요".
- 아래 고정 "확인" 버튼.

### 칭찬 문구 (`src/utils/praise.ts`)

순수 함수로 만들고 테스트한다.

```ts
export interface PraiseContext {
  taskTitle: string;
  roomType: RoomType | null;  // GENERAL_ROOM | LIVING_ROOM | BATHROOM | KITCHEN | ENTRANCE | BEDROOM
  intervalDays: number;       // computeHappinessGain과 같은 근사 (매일 1, 매주 7, 매달 30)
  lastOfDay: boolean;         // variant === 'full'
  leveledUp: boolean;
}
export function pickPraise(ctx: PraiseContext, random: () => number, lastPraise?: string): string;
```

**고르는 규칙**: 아래 상황을 우선순위대로 보고, 해당하는 **가장 높은 하나**의 묶음에서 무작위로 고른다. 해당하는 상황이 없으면 "방별"(roomType이 있을 때) + "기본" 묶음을 합쳐서 고른다. 늦게 한 일이나 시간대는 따로 구분하지 않는다. 직전에 보여준 문구(`lastPraise`, 모듈 변수에 보관)와 같으면 한 번 다시 고른다. `{task}`는 집안일 이름으로 바꾼다.

| 우선순위 | 상황 | 문구 |
|---|---|---|
| 1 | 오늘 마지막 할 일 (`lastOfDay`) | 오늘 할 일 끝! 이제 푹 쉬어요 · 오늘 몫을 다 해냈어요 · 오늘 우리집은 완벽해요 · 할 일 목록이 텅 비었어요! |
| 2 | 레벨업 | 추억이 한 뼘 더 쌓였어요! · 우리 사이가 더 가까워졌어요 · 레벨 업! 함께한 시간이 늘었어요 |
| 3 | 큰 일 (`intervalDays >= 30`) | 이건 큰일이었죠. 정말 대단해요! · 한동안은 신경 안 써도 돼요 · 오래 걸리는 일인데 해냈어요 |
| — | 방별: 부엌 | 부엌이 반짝반짝해요 · 요리할 맛 나는 부엌이 됐어요 |
| — | 방별: 화장실 | 화장실이 뽀송해졌어요 · 향기로운 화장실 완성! |
| — | 방별: 거실 | 거실에 앉고 싶어지네요 · 거실이 한결 넓어 보여요 |
| — | 방별: 침실 | 오늘 밤은 더 푹 잘 수 있겠어요 · 포근한 침실이 됐어요 |
| — | 방별: 현관 | 집에 들어올 때 기분 좋겠어요 · 현관이 환해졌어요 |
| — | 기본 | 정말 잘했어요! · 최고예요! · 덕분에 집이 반짝반짝해요! · 오늘도 해냈어요! · 깔끔하게 끝냈어요 · 역시 믿고 맡길 만해요 · 집이 고마워하고 있어요 · {task}, 완벽하게 끝! · 한 걸음 더 깨끗해졌어요 · 오늘의 살림왕! · 드디어 해냈어요! · 해야지 했던 걸 끝냈어요 · 속이 다 시원해요 |

- 문구는 상황별 객체 배열로 나눠 두어 나중에 문구만 추가하기 쉽게 한다.
- `GENERAL_ROOM`(사용자가 만든 방)은 방별 문구가 없다.
- 문구에 "밀린"을 쓰지 않는다.

### 완료 조건 (테스트)
- `pickPraise`: 각 우선순위 상황에서 해당 묶음의 문구가 나온다. 마지막 할 일과 레벨업이 겹치면 마지막 할 일 문구. 아무 상황도 없을 때 부엌이면 부엌·기본 묶음 중에서만 나온다. 같은 random에서 직전 문구와 다른 문구가 나온다. `{task}`가 치환된다.
- `variant: "light"`: 시트에 칭찬 문구·게이지·확인이 있고, 마스코트와 폭죽(`Fireworks`)은 렌더링되지 않는다. 막을 누르면 `goBack`.
- `variant: "full"`: `Fireworks`가 렌더링된다. 레벨이 오르면 `level-up` 카드가 보인다.
- 두 경우 모두 "남은 일" 문구가 없다.
- `Fireworks`는 `useReducedMotion`을 모킹해 두 경우 모두 렌더링 오류가 없다.
