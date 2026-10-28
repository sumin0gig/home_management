import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ONBOARDING_COMPLETED_AT_KEY } from "../../widget/widgetPromptState";

type MascotStatus = "loading" | "none" | "created";

// "우리집 준비 완료" 화면을 보여줄지 정한다.
// - 이번 실행 중에 마스코트가 없던 적이 있고(= 처음 만들었고) onboarding:completedAt이
//   없으면 보여준다. "시작하기"를 누르면 기록한다 (finish).
// - 앱 시작 때 마스코트와 방이 이미 있던 사용자(업데이트 후)는 기록만 하고 넘어간다.
export function useWelcomeGate(
  ready: boolean,
  mascotStatus: MascotStatus,
): { state: "checking" | "show" | "skip"; finish: () => Promise<void> } {
  const sawNoMascot = React.useRef( false );
  if (mascotStatus === "none") {
    sawNoMascot.current = true;
  }
  const [state, setState] = React.useState<"checking" | "show" | "skip">(
    "checking",
  );

  // 같은 실행 중에 다른 계정으로 다시 시작해 마스코트가 없어지면 다시 판단한다.
  React.useEffect( () => {
    if (mascotStatus === "none" && state !== "checking") {
      setState( "checking" );
    }
  }, [mascotStatus, state] );

  React.useEffect( () => {
    if (!ready || state !== "checking") {
      return;
    }
    let active = true;
    AsyncStorage.getItem( ONBOARDING_COMPLETED_AT_KEY )
    .then( completedAt => {
      if (!active) {
        return;
      }
      if (completedAt) {
        setState( "skip" );
      } else if (sawNoMascot.current) {
        setState( "show" );
      } else {
        setState( "skip" );
        AsyncStorage.setItem( ONBOARDING_COMPLETED_AT_KEY, String( Date.now() ) );
      }
    } )
    // 저장소를 못 읽으면 준비 완료 화면 없이 넘어간다 (다음 실행 때 다시 본다).
    .catch( () => active && setState( "skip" ) );
    return () => {
      active = false;
    };
  }, [ready, state] );

  const finish = React.useCallback(
    () =>
      AsyncStorage.setItem( ONBOARDING_COMPLETED_AT_KEY, String( Date.now() ) )
      // 기록에 실패해도 홈으로는 들어간다 (다음 실행에 한 번 더 보일 뿐이다).
      .catch( () => {} )
      .finally( () => setState( "skip" ) ),
    [],
  );

  return { state, finish };
}
