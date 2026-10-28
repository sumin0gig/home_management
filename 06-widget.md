# 06. 위젯 다시 만들기와 설치 안내

> 공통 규칙과 결정된 사항은 `00-README.md`를 따른다. 선행 작업: 02, 03

## 목표

푸시 알림을 쓰지 않으므로 위젯이 앱 밖의 유일한 알림판이다.

- 위젯을 앱과 같은 모양으로 다시 만들고, **오늘 할 일 이름만** 보여준다 (기한 정보·방 이름 없음).
- 날짜가 바뀌면 앱을 열지 않아도 위젯이 새 날짜 기준으로 바뀐다.
- 위젯에서 할 일을 누르면 앱에서 그 집안일 모달(03)이 열린다.
- 위젯에 마스코트를 보일지 설정할 수 있다.
- 위젯을 설치하지 않은 사람에게만 화면 전체 설치 안내를 띄운다. 언제든 닫을 수 있다.

## 범위 밖

- iOS 위젯 (`NativeModules.WidgetDataBridge` 경로는 그대로)
- 다른 가족이 완료한 일을 앱을 열지 않고 위젯에 반영하는 것

---

## 작업 내용

### 지금 문제
- 앱이 저장하는 스냅샷에 라벨 문자열("오늘", "기한 지남")이 박혀 있다. 다음 날이 되어도 앱을 열기 전까지 어제 기준으로 보인다.
- `task_widget_info.xml`의 `updatePeriodMillis="0"`이라 Android가 위젯을 다시 그리지 않는다.
- 기한과 상관없이 가장 이른 3개를 보여준다.
- 흰 바탕에 파란 글자라 앱과 어울리지 않는다.
- 위젯을 누르면 홈으로만 간다.
- 위젯 선택 화면의 미리보기가 앱 아이콘(`@mipmap/ic_launcher`)이다.
- 앱 안에 위젯 안내가 없다.

### 변경 파일
- `src/widget/taskWidgetSync.tsx`, `src/widget/TaskWidget.tsx`, `src/widget/widgetTaskHandler.tsx`
- 새 파일 `src/widget/useWidgetInstalled.ts`
- `android/app/src/main/res/xml/task_widget_info.xml`, `res/values/strings.xml`, 미리보기 이미지
- `App.tsx` (딥링크)
- 새 파일 `src/screens/home/WidgetPromptScreen.tsx`, 새 컴포넌트 `src/components/WidgetPreview/WidgetPreviewCard.tsx`
- `src/navigation/MainNavigator.tsx`, `src/navigation/types.ts`
- `src/screens/home/HomeScreen.tsx`, `src/screens/settings/SettingsScreen.tsx`
- 새 파일 `src/widget/WidgetConfigScreen.tsx` (3단계)

### 1단계. 데이터: 날짜만 저장하고 그릴 때 고르기

- 스냅샷 형식을 `{ tasks: { id, title, roomColor, nextDueDate }[], mascot: { fillColor, earStyle } | null }`로 바꾼다. 앞으로 7일 안에 기한이 있는 일을 기한 순으로 최대 12개 저장한다. 키 이름을 바꿔서(`TaskWidget:snapshot:v2`) 예전 형식과 섞이지 않게 한다.
- `TaskWidget`은 `today`를 props로 받아 그 자리에서 `isDueByToday`인 일만 고른다.
- `widgetTaskHandler`는 `WIDGET_ADDED`, `WIDGET_UPDATE`, `WIDGET_RESIZED` 때 `toDateString( new Date() )`를 오늘로 넘겨 다시 그린다.
- `task_widget_info.xml`의 `updatePeriodMillis`를 `1800000`(Android 최소값 30분)으로 바꾼다. 자정이 지나면 30분 안에 새 날짜 기준이 된다.
- 한계: 다른 가족이 완료한 일은 이 기기에서 앱을 열어 새로고침하기 전까지 위젯에 남는다. 이번 작업에서는 이대로 둔다.

### 2단계. 위젯 화면

**할 일 이름만 보여준다. 기한이 얼마나 지났는지, 남았는지, 방 이름은 표시하지 않는다.** 앱과 같은 색과 마스코트로 같은 앱이라는 게 바로 보이게 한다.

- 바깥: 배경 `colors.default`(#FFF9F2), 모서리 22, 안쪽 여백 12.
- **머리줄**: 마스코트 얼굴(28dp, `SvgWidget`으로 스냅샷의 마스코트 색·귀 모양을 반영해 그린다. 마스코트가 없거나 3단계 설정을 끄면 생략) + "오늘 할 일"(14, 굵게) + 오른쪽 끝에 개수 알약(배경 `commonColor.touchable`, 흰 숫자 12 굵게).
- **목록**: 할 일 이름을 **두 칸 격자**로 놓는다. 칸마다 흰 바탕, 모서리 10, 얇은 테두리(`commonColor.subtleBorder`), 안쪽 여백 8×9, 왼쪽에 방 색 8dp 사각형, 이름 13 굵게 한 줄(넘치면 말줄임).
  - 순서는 기한 순(오래된 것 먼저), 같으면 가나다순.
  - 4×2 기준 2열×3행 = 6칸. 보이는 행 수는 `widgetInfo.height`로 정한다(머리줄 약 44dp, 행당 약 40dp). 너비가 200dp보다 좁으면 1열.
  - 칸보다 할 일이 많으면 마지막 칸에 "+N개" (점선 테두리, 보조 글자색).
  - `react-native-android-widget`의 `FlexWidget`은 줄바꿈 배치가 확실하지 않으므로, 행 단위 `FlexWidget`(가로) 안에 칸 두 개(`flex: 1`)를 넣는 방식으로 만든다.
- **빈 상태**: 마스코트 얼굴(52dp) + "오늘 할 일 없어요"(15, 굵게) + "우리집이 깨끗해요"(12, 보조).
- **누르기**: 각 칸은 `clickAction="OPEN_URI"`, `homemanagement://task/{id}`. 머리줄·빈 곳·"+N개"는 `homemanagement://tasks`(홈).
- `App.tsx`의 `linking.config`에 `TaskSheet: 'task/:taskId'`를 추가하고, 스택의 첫 화면을 `HomeMain`으로 둔다(React Navigation의 `initialRouteName`). 앱이 꺼져 있다가 위젯으로 열려도 홈 위에 집안일 모달이 뜨고, 닫으면 홈이 보여야 한다.
- `strings.xml`의 `task_widget_description`을 "오늘 할 일을 한눈에 보여줘요"로.
- 위젯 선택 화면용 미리보기 이미지를 만들어 `android:previewImage`를 바꾼다. 예시 데이터로 그린 위젯 PNG면 된다(`WidgetPreview` 컴포넌트로 띄워 캡처해도 된다). 만들 수 없으면 지금 아이콘을 두고 보고에 적는다.

### 3단계. 위젯에 마스코트 보이기 설정

- 저장: AsyncStorage `widget:showMascot` (기본 `true`). 스냅샷에도 `showMascot`을 넣어 위젯이 읽게 한다.
- `false`면 머리줄은 "오늘 할 일" + 개수 알약만, 빈 상태는 글자 두 줄만 그린다. 나머지 배치는 같다.
- **앱 설정**: `SettingsScreen`의 "홈 화면 위젯" 묶음에 스위치 "위젯에 마스코트 보이기"(Android만). 바꾸면 바로 스냅샷을 다시 쓰고 `requestWidgetUpdate`로 다시 그린다.
- **런처에서 바꾸기 (Android 12 이상)**: `registerWidgetConfigurationScreen`으로 같은 스위치 하나짜리 설정 화면을 등록하고, `task_widget_info.xml`에 `android:configure`와 `android:widgetFeatures="reconfigurable|configuration_optional"`을 넣는다. 위젯을 추가할 때는 설정 화면이 뜨지 않고, 위젯을 길게 눌러 "위젯 설정"으로 들어갈 수 있다. 설정은 위젯별이 아니라 앱 전체에 하나다. 지금 라이브러리 버전에서 동작하지 않으면 앱 설정만 두고 보고에 적는다.
- 완료 조건: `showMascot: false`로 그린 위젯에 마스코트 SVG가 없다.

### 4단계. 설치 여부

`useWidgetInstalled(): boolean | null` — Android에서 `getWidgetInfo( "TaskWidget" )`의 길이가 1 이상이면 `true`, 0이면 `false`. 화면 포커스와 앱 복귀 때 다시 확인한다. iOS에서는 항상 `null`.

참고: `requestPinWidget`이 `true`를 돌려줘도 런처가 확인 창을 띄웠다는 뜻일 뿐 사용자가 실제로 추가했는지는 모른다. 설치 여부는 항상 `getWidgetInfo`로 다시 확인한다.

### 5단계. 설치 안내: 화면 전체 모달

- 새 화면 `WidgetPrompt`, 옵션 `presentation: "fullScreenModal"`, `headerShown: false`, 아래에서 올라오는 전환.
- **띄우는 조건** (`HomeScreen`에서 판단): Android, `useWidgetInstalled() === false`, 첫 데이터 로딩이 끝남, 홈이 가장 위 화면, 이번 앱 실행 중 아직 안 띄움, 마지막으로 닫은 지 7일이 지남(`widgetPrompt:dismissedAt`). 위젯으로 앱이 열린 경우(딥링크)에는 띄우지 않는다.
- **화면 구성** (배경 `colors.default`)
  - 오른쪽 위 ✕ (터치 44, `accessibilityLabel="닫기"`). 누르면 `dismissedAt`을 기록하고 닫힌다. Android 뒤로 가기도 같다.
  - 위쪽: 홈 화면 배경을 흉내 낸 모서리 둥근 상자 안에 `WidgetPreviewCard` — 2단계의 위젯과 같은 모양을 일반 RN 컴포넌트로 그리고, 사용자의 실제 오늘 할 일(없으면 예시 "설거지, 화장실 청소, 바닥 청소기")로 채운다.
  - 제목(23, 굵게, 가운데): "앱을 열지 않아도\n오늘 할 일이 보여요"
  - 설명(13.5, 보조, 가운데): "홈 화면에 우리집 위젯을 놓으면\n해야 할 집안일이 바로 보여요."
  - 아래 고정 버튼 "위젯 추가하기" → `requestPinWidget( { widgetName: "TaskWidget" } )`.
    - `true`: 화면을 그대로 두고, 앱이 다시 활성화될 때 `getWidgetInfo`로 설치가 확인되면 닫고 홈에 "위젯을 추가했어요"를 짧게 보여준다.
    - `false`이거나 오류: 같은 화면의 설명 자리를 직접 추가하는 방법 3단계로 바꾼다. ① 홈 화면 빈 곳을 길게 누르기 ② "위젯" 누르기 ③ "{APP_DISPLAY_NAME}"에서 "집안일 위젯"을 끌어다 놓기. 버튼은 "확인"(닫기)으로 바뀐다.
- **설정 메뉴**: 지금의 `SettingsScreen`에 "홈 화면 위젯" 묶음을 추가한다 (Android만). 설정 화면 전체 디자인은 09에서 다시 짜므로 지금은 기존 메뉴 모양에 맞춰 두 줄만 넣는다. 첫 줄은 "위젯"(설치 상태), 둘째 줄은 3단계의 스위치. 미설치면 누를 때 `WidgetPrompt`를 연다(7일 조건 무시). 설치되어 있으면 오른쪽에 "추가됨"을 보여주고 누를 수 없다.

### 완료 조건
- `TaskWidget` 렌더 테스트: 같은 스냅샷을 `today` 두 값으로 그렸을 때 다음 날에는 기한이 된 일이 새로 나타난다. 어떤 경우에도 "지남", "D-", "오늘" 같은 상태 글자와 방 이름이 없다.
- 할 일이 7개 이상이면 마지막 칸이 "+N개"다. 0개면 "오늘 할 일 없어요".
- 위젯 칸의 클릭 URI가 `homemanagement://task/{id}`이고, 이 링크로 `TaskSheet`가 열린다.
- `WidgetPrompt`: 설치됨이면 안 뜨고, 미설치면 뜨고, 닫으면 7일 동안 안 뜬다 (시간·저장소 모킹). `requestPinWidget`이 `false`면 직접 추가 방법이 보인다.

### 추가 조건 (07과의 관계)
- 07의 "우리집 준비 완료" 화면을 본 그 앱 실행 중에는 설치 안내를 띄우지 않는다. 07이 아직 없으면 무시한다. 07에서 `onboarding:completedAt`을 기록하면, 그 값이 이번 실행 중에 쓰였을 때 안내를 건너뛴다.
