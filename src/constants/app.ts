// 앱 이름은 아직 정하지 않았다. 새 문구에 앱 이름이 꼭 필요하면 이 상수만 쓴다.
// 지금 값은 android/app/src/main/res/values/strings.xml의 app_name과 같다.
export const APP_DISPLAY_NAME = 'HomeManagement';

// 의견 보내기 링크. TODO: 받을 곳(구글 폼 등)이 정해지면 채운다. 비어 있으면 설정에서 그 줄을 숨긴다.
export const FEEDBACK_URL = '';

// 관리자 넘기기 (서버 함수 transferFamilyOwnership). 백엔드를 배포한 뒤 true로 바꾼다.
// false인 동안 가족 화면·회원 탈퇴에서 넘기기 기능을 숨긴다.
export const OWNER_TRANSFER_ENABLED = false;

// 서버에서 참여하기 (joinFamilyByCode). 백엔드를 배포한 뒤 true로 바꾼다.
// false면 지금처럼 앱이 구성원 기록을 직접 만든다.
export const SERVER_JOIN_ENABLED = false;
