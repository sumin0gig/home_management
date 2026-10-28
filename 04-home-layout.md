# 04. 홈 목록, 평면도 배지, 헤더 가족 표시

> 공통 규칙과 결정된 사항은 `00-README.md`를 따른다. 선행 작업: 02, 03

## 목표

- 평면도는 지금처럼 홈 맨 위에 두고, 바로 아래에 "할 일"(기한이 오늘이거나 지난 일)과 "이번 주" 목록을 붙인다.
- 평면도의 빨간 점을 방마다 할 일 개수 배지로 바꾼다.
- 홈 헤더에 가족 구성원을 보여준다.

---

## 1단계. 홈 레이아웃: 평면도 위, 목록 아래

### 변경 파일
- `src/screens/home/HomeScreen.tsx`
- 새 파일 `src/components/HomeTaskList/HomeTaskList.tsx`, `src/components/HomeTaskList/HomeTaskRow.tsx`

### 화면 구조 (위에서 아래로, 전체가 하나의 ScrollView)

1. **"편집" 링크** — 지금 위치 그대로.
2. **평면도** — 지금의 `FloorPlanCanvas`, 방을 누르면 `RoomDetail`. 2단계의 개수 배지.
3. **범례 한 줄** — "숫자는 그 방의 할 일 개수" (작은 보조 글씨).
4. **요약 줄** — 큰 숫자로 기한이 오늘이거나 지난 일의 개수, 옆에 "오늘까지 할 일".
5. **목록** — 두 묶음. 비어 있는 묶음은 제목째 숨긴다.
   - **할 일**: `isDueByToday`. 기한 순(오래된 것 먼저), 같으면 `title` 가나다순.
   - **이번 주**: 1~6일 뒤.
   - 7일 이후 일정은 홈에 나오지 않는다 (방 상세에서 본다).
6. **빈 상태** — "할 일"이 0개면 목록 위에 "오늘 할 일을 모두 마쳤어요" 상자. "이번 주" 묶음은 그 아래 그대로.

### `HomeTaskRow`

- 1줄: 집안일 이름 (굵게)
- 2줄: 방 색 작은 사각형 + 방 이름 · 상태 라벨(`formatDueStatus`, 상태 색) · `formatRecurrence( task )`
- 오른쪽: 작은 오른쪽 화살표(›). **완료 버튼은 없다.**
- 행 전체가 버튼이고, 누르면 `navigate( "TaskSheet", { taskId } )`.
- 접근성: `accessibilityRole="button"`, `accessibilityLabel={ `${task.title}, ${방 이름}, ${상태}` }`, `accessibilityHint="집안일 상세 열기"`.
- 터치 높이 56 이상.

### 로딩과 오류

- 첫 로딩(`status === "loading"`)은 지금처럼 스피너.
- 오류 문구 옆에 "다시 시도" 버튼을 두고 `refreshTasksForFamily`를 부른다.

### 완료 조건 (테스트)
- 4일 지남 / 오늘 / 내일 / 5일 뒤 / 10일 뒤가 섞인 목록에서 묶음과 순서가 맞다 (4일 지남과 오늘이 "할 일"에, 10일 뒤는 없음).
- 행을 누르면 `TaskSheet`로 이동하고 `completeTask`는 불리지 않는다.
- "할 일"이 0개일 때 빈 상태 문구가 나온다.
- 화면 어디에도 "밀린"이라는 글자가 없다 (렌더 결과 문자열 검사).

---

## 2단계. 평면도 개수 배지

### 변경 파일
- `src/components/FloorPlan/FloorPlanCanvas.tsx`
- `src/components/FloorPlan/DraggableRoomBlock.tsx`
- `src/screens/home/HomeScreen.tsx`

### 요구사항

- `FloorPlanCanvas`의 `hasDueToday?: (room) => boolean`를 `getDueCount?: (room) => number`로 바꾼다 (기한이 오늘이거나 지난 일의 개수).
- `DraggableRoomBlock`의 10×10 빨간 점을 개수 배지로 바꾼다.
  - 위치: 방 블록 **오른쪽 아래** (방 이름이 왼쪽 위, 마스코트가 가운데라 겹치지 않게).
  - 모양: 높이 16, 최소 너비 16, 둥근 모서리, 흰 숫자 11px 굵게, 배경 `commonColor.textDefault` 한 가지 색.
  - 0이면 그리지 않는다. 기존 `testID={ `due-badge-${room.id}` }`는 유지.
- `RoomEditScreen`, `RoomSetupScreen`은 이 prop을 넘기지 않으므로 배지가 나오지 않는다. 동작만 확인.

---

## 3단계. 홈 헤더에 가족 표시

### 변경 파일
- `src/navigation/MainNavigator.tsx` (`homeOptions`)
- 새 컴포넌트 (예: `src/navigation/FamilyAvatarStack.tsx`)

### 요구사항

- 홈 헤더 오른쪽, 설정 아이콘 **왼쪽**에 가족 구성원을 겹친 원으로 보여준다 (`useFamilyStore`의 `members`).
  - 원 지름 26, 테두리 2(헤더 배경색), 왼쪽으로 7씩 겹침. 안에는 `displayName` 앞 1~2글자.
  - 최대 3명, 넘으면 마지막 원에 "+N".
  - 배경색은 구성원 id로 `ROOM_COLOR_PALETTE`에서 고정적으로 고른다.
- 누르면 `FamilyMain`. 구성원이 나 혼자면 점선 테두리 "+" 원을 덧붙이고, 그 원은 `AddFamilyMember`로 이동한다.
- `accessibilityLabel`: "가족 {N}명, 가족 화면 열기" / "가족 초대하기".
- 설정 화면의 "가족 관리" 메뉴는 그대로 둔다.
