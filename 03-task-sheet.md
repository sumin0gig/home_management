# 03. 집안일 상세를 아래에서 올라오는 모달로

> 공통 규칙과 결정된 사항은 `00-README.md`를 따른다. 선행 작업: 02

## 목표

지금 집안일 상세는 별도 페이지라 방 → 집안일 → "완료했어요"까지 화면을 세 번 넘어가야 한다. 홈과 방 화면 모두에서 집안일을 누르면 상세가 **아래에서 올라오는 모달**로 열리고, 모달 맨 아래에 고정된 "완료" 버튼으로 끝내게 바꾼다. 기존 집안일 상세 페이지는 삭제한다.

- 이 작업이 끝나면 "완료"는 `CompleteCheck`로 `variant`를 넘긴다. `CompleteCheck`의 새 모양은 05에서 만든다. 그 전까지는 지금 `CompleteCheck` 화면이 그대로 뜨고 `variant`는 무시돼도 된다. 단, 라우트 타입에는 05의 파라미터(`previousDueDate`, `variant`)를 이번에 추가한다.

## 범위 밖

- 방 상세(`RoomDetailScreen`)의 레이아웃 ("+" 버튼 라벨과 터치 영역만)
- 집안일 추가·수정 화면 레이아웃 (완료 기록 목록만 모달로 옮긴다)

---

## 1단계. 집안일 모달 화면 (집안일 상세 페이지 대체)

### 변경 파일
- 새 파일 `src/screens/home/TaskSheetScreen.tsx`
- `src/navigation/MainNavigator.tsx`, `src/navigation/types.ts`
- `src/components/TaskCard/TaskCard.tsx`
- `src/screens/home/RoomDetailScreen.tsx` ("+" 버튼 라벨만)
- `src/screens/home/TaskFormScreen.tsx` (완료 기록 목록 제거)
- **삭제** `src/screens/home/TaskDetailScreen.tsx`, `__tests__/screens/home/TaskDetailScreen.test.tsx` (새 테스트로 대체)

### 구현 방식

모달은 **네비게이션 화면**으로 만든다. React Native의 `Modal` 컴포넌트를 쓰지 않는다. 완료 후 축하 모달로 바로 넘어가야 하는데 `Modal` 두 개를 겹치면 불안정하고, 화면으로 만들면 뒤로 가기·위젯 딥링크를 그대로 쓸 수 있다.

- `MainStackParamList`에서 `TaskDetail`을 지우고 `TaskSheet: { taskId: string }`를 추가한다.
- `Stack.Screen name="TaskSheet"`의 옵션: `presentation: "transparentModal"`, `headerShown: false`, `animation: "fade"`. 시트가 아래에서 올라오는 움직임은 화면 안에서 `react-native-reanimated`로 직접 준다 (250ms). `useReducedMotion()`이 true면 바로 표시.
- 앱 안의 모든 `navigate( "TaskDetail", ... )`를 `navigate( "TaskSheet", ... )`로 바꾼다 (`TaskCard` 포함).

### 화면 구성

- 뒤 화면 위에 어두운 막(`commonColor.overlay`). 막을 누르거나 Android 뒤로 가기를 누르면 닫힌다(`goBack()`).
- 시트: 화면 높이의 90%, 위쪽 모서리 20, 배경 `colors.default`. 맨 위에 끌기 손잡이(36×4).
  - 아래로 끌어 닫기: 손잡이 영역에서 아래로 80 이상 끌면 닫힌다 (`react-native-gesture-handler`의 Pan). 내용 스크롤과 충돌하지 않도록 손잡이와 머리줄에만 건다.
- **머리줄**: 왼쪽 ✕(닫기, `accessibilityLabel="닫기"`), 오른쪽 "수정" → `navigation.replace( "TaskForm", { taskId } )`.
- **스크롤 영역**
  1. 방 이름 배지(방 색 작은 사각형 + 방 이름) + 상태 라벨(`formatDueStatus`, 상태 색). **"청소"를 붙이지 않는다.**
  2. 집안일 이름 (22, 굵게)
  3. 한 줄: `formatRecurrence( task )` · "마지막 완료 10월 16일 · 수민" (기록이 없으면 "아직 완료 기록이 없어요")
  4. 방법 카드 (지금 상세 화면의 번호 목록과 같은 내용). 없으면 "등록된 방법이 없어요. 수정에서 추가할 수 있어요."
  5. TIP 상자 (있을 때만)
  6. "완료 기록" 제목 + 최근 기록 목록 (날짜(요일) · 이름). `listTaskLogs`를 그대로 쓰고 최근 10개.
- **아래 고정 "완료" 버튼**: 시트 맨 아래에 고정, 위에 얇은 구분선, 아래 여백은 안전 영역 + 16. 스크롤해도 움직이지 않는다.

### "완료"를 누르면

1. 버튼을 "완료 중…"으로 바꾸고 비활성화.
2. 완료 전 값을 잡아둔다: `happinessBefore`(마스코트), `previousDueDate`(task의 `nextDueDate`).
3. `completeTask( task )`. 실패하면 버튼을 되돌리고 시트 안에 `error`를 보여준다.
4. 성공하면 **오늘의 마지막 할 일인지** 판단한다: `isDueByToday( previousDueDate, today )`이고, 완료 후 스토어의 가족 전체 task 중 `isDueByToday( nextDueDate, today )`인 것이 0개.
5. `navigation.replace( "CompleteCheck", { taskId, happinessBefore, previousDueDate, variant: lastOfDay ? "full" : "light" } )`. `replace`라서 축하를 닫으면 시트를 열었던 화면(홈 또는 방)으로 돌아간다.

### 방 화면

- `TaskCard`를 누르면 `TaskSheet`가 열린다. 방 화면 레이아웃은 그대로다.
- **"+"(집안일 추가) 버튼은 지금처럼 목록 위 오른쪽에, 배경·테두리 없는 plus 아이콘 그대로 둔다.** 집안일이 많아져도 아래로 스크롤하지 않고 찾을 수 있어야 한다. 보이는 크기는 바꾸지 말고 `hitSlop`으로 터치 영역만 44 이상으로 넓히고, `accessibilityLabel="집안일 추가"`를 단다. `Icon`이 `onPress`를 받을 때 `accessibilityLabel`을 필수로 받게 타입을 바꾼다.

### 수정 화면

- `TaskFormScreen` 수정 모드 맨 아래의 "최근 완료 기록"을 지운다 (모달로 옮겼다). `listTaskLogs` 호출도 함께 지운다.

### 완료 조건 (테스트)
- `TaskSheet`가 방법·TIP·완료 기록·마지막 완료 줄을 그린다. 방법이 없으면 안내 문구.
- ✕와 막을 누르면 `goBack`. "수정"을 누르면 `TaskForm`으로 `replace`.
- "완료"를 누르면 `completeTask`가 불리고 `CompleteCheck`로 `replace`된다. 마지막 할 일이면 `variant: "full"`, 아니면 `"light"`. 이번 주 일(기한 전)을 완료했을 때는 다른 할 일이 0개여도 `"light"`.
- 완료 요청 중에 버튼을 다시 눌러도 `completeTask`는 한 번만 불린다.
