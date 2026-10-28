import { PLAY_STORE_URL } from '../../actions';

// 초대 화면에서 공유하는 메시지. 받는 사람이 앱이 없을 수 있으므로 설치 링크를 먼저 둔다.
export function buildInviteMessage(
  familyName: string,
  inviteCode: string,
): string {
  return [
    `${familyName}에 참여해 주세요!`,
    `1) 앱 설치: ${PLAY_STORE_URL}`,
    `2) 앱을 열고 초대 코드 ${inviteCode} 입력`,
  ].join('\n');
}
