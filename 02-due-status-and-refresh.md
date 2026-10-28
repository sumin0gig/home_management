# 02. 기한 상태 함수, 조용한 새로고침, 상태 색

> 공통 규칙과 결정된 사항은 `00-README.md`를 따른다. 선행 작업: 없음

## 목표

홈·모달·위젯이 함께 쓸 기반을 먼저 만든다. 화면 모양은 거의 바뀌지 않는다.

- 기한 상태를 한 함수로 계산해서 앱과 위젯의 표기를 맞춘다 ("4일 지남 / 오늘 / 내일 / D-5").
- 다른 가족이 완료한 일이 홈에 반영되도록, 화면을 깜빡이지 않는 새로고침을 만든다.
- 상태 라벨 색 세 개를 추가한다.

---

## 1단계. 기한 상태 함수

### 변경 파일
- `src/utils/date.ts`
- `src/widget/taskWidgetSync.tsx`
- `src/components/TaskCard/TaskCard.tsx`

### 요구사항

`src/utils/date.ts`에 추가한다.

```ts
export type DueStatus =
  | { kind: 'past'; days: number }
  | { kind: 'today' }
  | { kind: 'upcoming'; days: number };

export function getDueStatus(nextDueDate: string, today: string): DueStatus;
export function formatDueStatus(status: DueStatus): string;
// past → `${days}일 지남`, today → '오늘', upcoming 1일 → '내일', 그 외 → `D-${days}`

export function isDueByToday(nextDueDate: string, today: string): boolean; // 기한이 오늘이거나 지난 일
```

- 날짜 차이는 `parseDateString`으로 로컬 날짜를 만든 뒤 일수로 계산한다 (`new Date('YYYY-MM-DD')`는 UTC로 해석되므로 쓰지 않는다).
- `taskWidgetSync.tsx` 안의 자체 `formatDueLabel`을 지운다 (위젯은 06에서 상태 라벨 없이 다시 만든다).
- `TaskCard`도 새 함수로 바꿔서, 지금은 아무 표시도 없는 기한 지남·오늘에도 라벨이 나오게 한다.
- `date.ts`의 `formatDueLabel`은 다른 곳에서 더 쓰지 않으면 제거한다.

### 완료 조건
- 단위 테스트: 3일 전, 어제, 오늘, 내일, 5일 뒤, 월말→월초, 연말→연초.

---

## 2단계. 조용한 새로고침

### 변경 파일
- `src/store/useTaskStore.ts`
- `src/screens/home/HomeScreen.tsx`

### 요구사항

`useTaskStore`에 `refreshTasksForFamily(familyId)`와 `isRefreshing: boolean`을 추가한다.

- `fetchTasksForFamily`와 같은 데이터를 받지만 **`status`를 `'loading'`으로 바꾸지 않는다.** 지금 `HomeScreen`은 `taskStatus === "loading"`이면 화면 전체를 스피너로 바꾸므로, 그대로 부르면 홈이 깜빡인다.
- 실패하면 기존 `tasks`는 그대로 두고 `error`만 채운다.

`completeTask`, `updateTask`가 끝에서 부르는 `fetchTasksForFamily`도 `refreshTasksForFamily`로 바꾼다.

`completeTask`의 순서를 이렇게 바꾼다: ① TaskLog 생성 ② 다음 기한 저장 ③ 스토어의 해당 task `nextDueDate`를 바로 갱신 ④ `addHappiness` ⑤ `true` 반환. 전체 새로고침은 기다리지 않고 뒤에서 돌린다 (실패하면 `error`만). 축하가 네트워크를 기다리지 않고 빨리 뜨게 하고, 03에서 "오늘 마지막 할 일"을 바로 판단할 수 있게 하기 위해서다.

`HomeScreen`에서 세 경우에 `refreshTasksForFamily`를 부른다.

1. 화면 포커스 (`useFocusEffect`). 첫 진입 때는 기존 `useEffect`의 `fetchTasksForFamily`가 돌므로 중복 호출하지 않는다.
2. 앱이 백그라운드에서 돌아올 때 (`AppState`가 `'active'`). 홈이 포커스 상태일 때만.
3. 당겨서 새로고침. 홈 전체 `ScrollView`에 `RefreshControl`.

기존 포커스 리스너(마스코트 방 다시 뽑기)는 그대로 둔다.

### 완료 조건
- 포커스·당겨서 새로고침·완료 시 스피너 화면으로 바뀌지 않는다.
- 새로고침 실패 시 목록이 비워지지 않는다.
- `completeTask`가 `true`를 돌려준 시점에 해당 task의 `nextDueDate`가 이미 새 값이다.

---

## 3단계. 상태 색 토큰

`src/styles/commonStyle.ts`의 `commonColor`에 상태 색 세 개만 추가한다. 기존 색은 바꾸지 않는다.

```ts
duePast: '#B42318',      // "4일 지남" 라벨 (흰 배경 대비 6.6:1)
dueToday: '#9A5507',     // "오늘" 라벨
dueUpcoming: '#666666',  // "내일", "D-n" 라벨 (기존 textMuted와 같은 값)
```

- 상태 라벨은 이 토큰으로만 칠한다. `commonColor.info`(파랑)로 칠하던 D-day 표기도 `dueUpcoming`으로 바꾼다.
- 묶음 제목, 요약, 평면도 배지에는 상태 색을 쓰지 않는다.
