// 홈이 처음 뜰 때 이어서 열 화면 (예: 준비 완료 화면의 "가족 초대하기").
// 준비 완료 화면은 MainNavigator 밖이라 직접 navigate할 수 없어서 홈에 넘긴다.
type PendingRoute = 'AddFamilyMember';

let pending: PendingRoute | null = null;

export function setPendingRoute(route: PendingRoute): void {
  pending = route;
}

export function takePendingRoute(): PendingRoute | null {
  const route = pending;
  pending = null;
  return route;
}
