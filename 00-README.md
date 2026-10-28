# home_management UX 개선 작업 묶음

UX 개선안(R5)을 Claude Code에 맡길 수 있게 작업 단위로 나눈 지시서 모음이다. **한 번에 파일 하나씩** 맡기고, 끝나면 보고를 확인한 뒤 다음 파일로 넘어간다.

## 파일 목록과 권장 순서

| 순서 | 파일 | 내용 | 선행 작업 | 백엔드 배포 |
|---|---|---|---|---|
| 1 | `01-family-join-bugfix.md` | 가족이 두 개가 되는 버그, 초대 메시지 | 없음 | 없음 |
| 2 | `02-due-status-and-refresh.md` | 기한 상태 함수, 조용한 새로고침, 상태 색 | 없음 | 없음 |
| 3 | `03-task-sheet.md` | 집안일 상세를 모달로, 상세 페이지 삭제 | 02 | 없음 |
| 4 | `04-home-layout.md` | 홈 목록, 평면도 배지, 헤더 가족 표시 | 02, 03 | 없음 |
| 5 | `05-celebration.md` | 가벼운 축하 / 마지막 할 일 축하 | 03 | 없음 |
| 6 | `06-widget.md` | 위젯 다시 만들기, 설치 안내 | 02, 03 | 없음 |
| 7 | `07-onboarding.md` | 로그인부터 마스코트까지 처음 시작 흐름 | 01 | 없음 |
| 8 | `08-room-edit-and-mascot.md` | 방 편집 삭제 위치, 마스코트 자동 저장, 공용 확인 시트 | (07이 끝났으면 기본 집안일 선택 포함) | 없음 |
| 9 | `09-settings.md` | 설정 화면 다시 짜기, 이름 바꾸기, 로그아웃 확인 | 06, 08 | 없음 |
| 10 | `10-owner-transfer-backend.md` | 관리자 넘기기 백엔드 함수 | 없음 | **필요** |
| 11 | `11-family-screen.md` | 가족 화면, 가족 떠나기, 가족 초대 화면 | 01, 08 (10이 배포됐으면 넘기기 포함) | 없음 |
| 12 | `12-account-deletion.md` | 회원 탈퇴 전용 화면 | 08, 09 (10이 배포됐으면 넘기기 연결) | 없음 |

- 01은 다른 작업과 상관없이 바로 고치는 게 좋다 (사용자 데이터가 꼬이는 버그).
- 02~06은 홈 흐름이라 순서대로 한다.
- 07, 08은 02~06과 독립이라 병행해도 되지만, 같은 파일(`RootNavigator`, `useRoomStore`)을 건드리므로 **동시에 두 작업을 열지 않는다.**
- 10은 배포가 필요하다. Claude Code는 배포하지 않고 "배포 필요"를 보고만 한다. 배포 전에는 11·12에서 넘기기 기능을 숨긴 채로 진행한다.

## 모든 작업 공통 규칙

1. **`CLAUDE.md` 규칙을 그대로 따른다.** 특히 `src/components/**`, `src/screens/**`, `__tests__/**`의 큰따옴표, 호출 괄호 안쪽 공백, JSX 중괄호 안쪽 공백, 긴 삼항 연산자 모양은 Prettier가 지워버리므로 포맷 후 손으로 다시 적용한다. 비동기 처리는 "Promise 체인 우선" 규칙을 따른다.
2. **작업 전에 `npm test`를 한 번 돌려 기존 실패를 기록한다.** 기존 실패는 고치지 말고 보고에서 따로 표시한다. (단, 07에서 `RoomSetupScreen`을 다시 쓰면서 `CLAUDE.md`에 적힌 기존 실패 4건이 자연히 사라지는 것은 괜찮다.)
3. 단계가 끝날 때마다 `npx tsc --noEmit`, `npm run lint`, `npm test`.
4. **새 라이브러리는 추가하지 않는다.** 이미 있는 것: React Navigation(native-stack), `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-svg`, `react-native-root-toast`, `@react-native-clipboard/clipboard`, `react-native-device-info`, `react-native-qrcode-svg`, `react-native-camera-kit`.
5. **반복 주기 작업은 끝난 상태다.** `src/utils/date.ts`의 `formatRecurrence`, `formatDateWithWeekday`, `computeNextDueDate`, `parseDateString`을 그대로 쓰고 다시 만들지 않는다.
6. **백엔드 배포를 하지 않는다.** 스키마나 함수가 바뀌면 보고에 "배포 필요"로 적는다.
7. 단계마다 커밋을 나누고, 커밋 메시지 첫 줄에 파일 번호와 단계 이름을 쓴다 (예: `03-2 집안일 모달 화면 구성`).

## 결정된 사항 (어느 작업에서도 구현하지 않는 것)

- 목록에서 바로 완료하지 않는다. 완료는 집안일 모달의 "완료" 버튼으로만 한다.
- 완료 되돌리기, 연속 기록(스트릭), 푸시 알림은 넣지 않는다. `amplify/functions/taskReminder`는 꺼진 상태로 둔다.
- **화면 문구에 "밀린 일"이라는 표현을 쓰지 않는다.** 묶음 이름, 요약, 축하 문구, 접근성 라벨 모두. 기한이 지난 일도 "할 일"이다. 개별 행의 상태 라벨("4일 지남")은 쓴다.
- 앱 이름(런처 이름 `HomeManagement`)은 아직 정하지 않았다. 새 문구에 앱 이름이 꼭 필요하면 `src/constants/app.ts`의 `APP_DISPLAY_NAME` 상수 하나를 만들어 쓰고, 지금 값은 `strings.xml`의 `app_name`과 같게 둔다.

## 공통 디자인 값

- 화면 배경: `colors.default`(#FFF9F2). 카드·목록 바탕은 흰색, 테두리는 `commonColor.subtleBorder`.
- 주 버튼: `commonColor.touchable`. 위험한 동작 버튼: `commonColor.error`.
- 상태 라벨 색은 02에서 추가하는 `duePast`, `dueToday`, `dueUpcoming`만 쓴다.
- 아래에서 올라오는 시트: 위쪽 모서리 20, 배경 `colors.default`, 맨 위 끌기 손잡이 36×4, 올라오는 시간 250ms. `useReducedMotion()`이면 움직임 없이 표시.

## 매 작업 보고 형식

- 단계별로 바뀐 파일과 삭제한 파일
- `tsc`, `lint`, `test` 결과 (작업 전부터 있던 실패는 따로)
- 지시서와 다르게 구현한 부분과 이유
- 에뮬레이터에서 직접 확인해야 하는 항목
- 배포가 필요한 변경 (있으면)
