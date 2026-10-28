import { ROOM_COLOR_PALETTE } from '../styles/commonStyle';

// 구성원 id로 팔레트 색을 고정적으로 고른다 (앱을 다시 열어도 같은 색).
// 홈 헤더의 가족 원과 가족 화면의 얼굴 원이 같이 쓴다.
export function avatarColor(memberId: string): string {
  let hash = 0;
  for (const char of memberId) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_000_007;
  }
  return ROOM_COLOR_PALETTE[hash % ROOM_COLOR_PALETTE.length];
}

// 이름 앞 1~2글자. 로마자 이름은 두 글자, 한글 등은 한 글자가 원 안에 잘 맞는다.
export function avatarInitials(displayName: string): string {
  const chars = Array.from(displayName.trim());
  if (chars.length === 0) {
    return '?';
  }
  return /^[A-Za-z]/.test(chars[0]) ? chars.slice(0, 2).join('') : chars[0];
}
