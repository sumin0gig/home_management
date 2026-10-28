# 08. 방 편집 삭제 위치, 마스코트 자동 저장, 공용 확인 시트

> 공통 규칙과 결정된 사항은 `00-README.md`를 따른다. 선행 작업: 없음 (07이 끝났으면 3단계 포함)

## 목표

- 방 편집 화면에서 모든 방에 떠 있는 빨간 "−" 삭제 버튼을 없애고, 삭제는 방 수정 시트 안으로 옮긴다.
- "내 마스코트"에서 고를 때마다 바로 저장한다.
- 09·11·12에서 함께 쓸 **아래에서 올라오는 확인 시트**를 만든다.

---

## 1단계. 공용 확인 시트 `ConfirmSheet`

### 변경 파일
- 새 컴포넌트 `src/components/common/ConfirmSheet.tsx`

### 요구사항
```ts
interface Props {
  visible: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;        // 목록 등 추가 내용
  confirmText: string;
  confirmTone?: 'default' | 'danger'; // danger면 commonColor.error
  cancelText?: string;               // 기본 "취소"
  confirmDisabled?: boolean;
  isConfirming?: boolean;            // 버튼에 스피너, 두 번 눌리지 않음
  onConfirm: () => void | Promise<unknown>;
  onCancel: () => void;
}
```
- RN `Modal`(`transparent`, `animationType="slide"`, `statusBarTranslucent`)로 만든다. 이 시트 위에 다른 모달을 겹치지 않는 곳에서만 쓴다.
- 어두운 막 + 아래 시트 (공통 디자인 값). 끌기 손잡이 → 제목(18, 굵게) → 설명(13) → `children` → 버튼 두 개 가로 배치(취소: 테두리 버튼, 확인: 주 버튼 또는 위험 버튼).
- 막을 누르거나 뒤로 가기를 누르면 `onCancel`. `isConfirming` 동안에는 닫히지 않는다.
- 아래 여백은 안전 영역 + 16.

### 완료 조건
- 렌더 테스트: 제목·설명·두 버튼, `danger`면 확인 버튼 색, `isConfirming`이면 확인을 눌러도 `onConfirm`이 다시 불리지 않는다.

---

## 2단계. 방 편집: 삭제를 방 수정 안으로

### 변경 파일
- `src/screens/home/RoomEditScreen.tsx`
- `src/components/FloorPlan/RoomEditModal.tsx`
- `src/components/FloorPlan/DraggableRoomBlock.tsx`, `FloorPlanCanvas.tsx` (`removable` 정리)

### 요구사항
- `RoomEditScreen`에서 `FloorPlanCanvas`에 `removable`을 넘기지 않는다. 다른 곳에서도 쓰지 않으면 `removable`/`isRemovable`과 "−" 버튼 코드를 지운다.
- 설명 문구를 "방을 누르면 고칠 수 있고, 끌면 옮겨져요."로.
- `RoomEditModal`을 아래에서 올라오는 시트 모양으로 바꾼다 (지금 `ModalView` 대신, 공통 디자인 값). 내용은 그대로: 방 이름(제목), 종류 칩, 이름 입력, 가로·세로 조절(**가로와 세로를 각각 한 줄씩**), 색, "저장".
- 시트 맨 아래에 빨간 글자 버튼 "방 삭제"를 둔다. 방을 새로 만드는 중(`RoomSetupScreen`)에는 숨긴다.
- "방 삭제"를 누르면 `ConfirmSheet`:
  - 제목: "{방 이름}을 삭제할까요?"
  - 설명: "집안일 {N}개와 완료 기록이 함께 삭제돼요." (N은 `useTaskStore`에서 그 방의 집안일 수. 0이면 "이 방에는 집안일이 없어요.")
  - 확인: "삭제" (`danger`)
  - 지금 `DraggableRoomBlock`의 `removeRoom` 호출을 이쪽으로 옮긴다.

### 완료 조건
- 방 편집 도면에 삭제 버튼이 없다.
- 방 수정 시트에서 "방 삭제" → 확인하면 `removeRoom`이 불리고 시트가 닫힌다.
- 확인 설명에 그 방의 집안일 수가 들어간다.

---

## 3단계. 방 추가 시 기본 집안일 고르기 (07이 끝났을 때만)

### 변경 파일
- `src/components/FloorPlan/AddRoomModal.tsx`
- `src/screens/home/RoomEditScreen.tsx`

### 요구사항
- 07의 `TemplateChoreList`와 `addRoom`의 `templateIds`가 있으면, 방 추가에서 종류를 고른 뒤 그 종류의 기본 집안일을 체크 목록으로 보여준다(기본 모두 선택). "추가 · 집안일 N개" 버튼으로 만든다.
- 07이 아직 안 끝났으면 이 단계는 건너뛰고 보고에 적는다.

---

## 4단계. 내 마스코트 자동 저장

### 변경 파일
- `src/screens/home/MascotDetailScreen.tsx`

### 요구사항
- 귀·꼬리·색을 바꿀 때마다 `updateMascot`을 부른다. 빠르게 여러 번 바꾸면 마지막 값만 저장되게 400ms 지연(디바운스)한다.
- 저장되면 `react-native-root-toast`로 "저장했어요"를 짧게. 실패하면 화면의 값을 마지막으로 저장된 값으로 되돌리고 오류 문구를 보여준다.
- "저장" 버튼은 지운다.
- 화면을 떠날 때 저장 대기 중인 값이 있으면 바로 저장한다.

### 완료 조건
- 타이머를 앞당기는 테스트에서 연속 3번 바꾸면 `updateMascot`이 마지막 값으로 한 번 불린다.
- 실패하면 값이 되돌아간다.
