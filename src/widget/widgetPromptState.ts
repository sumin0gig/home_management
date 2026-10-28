import AsyncStorage from '@react-native-async-storage/async-storage';

// 위젯 설치 안내(WidgetPrompt)를 언제 띄울지 정하는 데 쓰는 값들.

export const WIDGET_PROMPT_DISMISSED_AT_KEY = 'widgetPrompt:dismissedAt';
// 07(온보딩)이 "우리집 준비 완료"를 보여줄 때 기록한다.
export const ONBOARDING_COMPLETED_AT_KEY = 'onboarding:completedAt';
export const WIDGET_PROMPT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// 이번 앱 실행에 대한 값 (앱을 다시 켜면 처음으로 돌아간다)
const launch = {
  startedAt: Date.now(),
  shown: false,
  openedFromWidget: false,
};

export function markOpenedFromWidget(): void {
  launch.openedFromWidget = true;
}

export function markWidgetPromptShown(): void {
  launch.shown = true;
}

export function recordWidgetPromptDismissed(now = Date.now()): Promise<void> {
  return AsyncStorage.setItem(WIDGET_PROMPT_DISMISSED_AT_KEY, String(now));
}

// 테스트에서 실행 상태를 처음으로 되돌린다.
export function resetWidgetPromptLaunchState(): void {
  launch.startedAt = Date.now();
  launch.shown = false;
  launch.openedFromWidget = false;
}

// 설치 여부·화면 조건을 뺀 나머지(이번 실행·7일·딥링크·온보딩) 조건.
export async function canShowWidgetPrompt(now = Date.now()): Promise<boolean> {
  if (launch.shown || launch.openedFromWidget) {
    return false;
  }
  const [dismissedAt, onboardingCompletedAt] = await Promise.all([
    AsyncStorage.getItem(WIDGET_PROMPT_DISMISSED_AT_KEY),
    AsyncStorage.getItem(ONBOARDING_COMPLETED_AT_KEY),
  ]);
  // 이번 실행 중에 "우리집 준비 완료"를 봤으면 건너뛴다.
  if (
    onboardingCompletedAt &&
    Number(onboardingCompletedAt) >= launch.startedAt
  ) {
    return false;
  }
  if (dismissedAt && now - Number(dismissedAt) < WIDGET_PROMPT_COOLDOWN_MS) {
    return false;
  }
  return true;
}
