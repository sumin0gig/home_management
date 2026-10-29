// 완료 축하 칭찬 문구. 상황별 묶음으로 나눠 두어 문구만 추가하기 쉽게 한다.
// 문구에 "밀린"을 쓰지 않는다 (기한이 지난 일도 "할 일"이다).

export type PraiseRoomType =
  | 'GENERAL_ROOM'
  | 'LIVING_ROOM'
  | 'BATHROOM'
  | 'KITCHEN'
  | 'ENTRANCE'
  | 'BEDROOM';

export interface PraiseContext {
  taskTitle: string;
  roomType: PraiseRoomType | null;
  // computeHappinessGain과 같은 근사 (매일 1, 매주 7, 매달 30)
  intervalDays: number;
  // variant === 'full' (오늘의 마지막 할 일)
  lastOfDay: boolean;
  leveledUp: boolean;
}

// intervalDays가 이 이상이면 "큰 일"
export const BIG_TASK_DAYS = 30;

// 우선순위가 높은 것부터. 해당하는 가장 높은 하나의 묶음에서만 고른다.
interface PrioritySituation {
  key: 'lastOfDay' | 'levelUp' | 'bigTask';
  matches: (ctx: PraiseContext) => boolean;
  messages: string[];
}

export const PRIORITY_PRAISES: PrioritySituation[] = [
  {
    key: 'lastOfDay',
    matches: ctx => ctx.lastOfDay,
    messages: [
      '오늘 할 일 끝! 이제 푹 쉬어요',
      '오늘 몫을 다 해냈어요',
      '오늘 우리집은 완벽해요',
      '할 일 목록이 텅 비었어요!',
    ],
  },
  {
    key: 'levelUp',
    matches: ctx => ctx.leveledUp,
    messages: [
      '추억이 한 뼘 더 쌓였어요!',
      '우리 사이가 더 가까워졌어요',
      '레벨 업! 함께한 시간이 늘었어요',
    ],
  },
  {
    key: 'bigTask',
    matches: ctx => ctx.intervalDays >= BIG_TASK_DAYS,
    messages: [
      '이건 큰일이었죠. 정말 대단해요!',
      '한동안은 신경 안 써도 돼요',
      '오래 걸리는 일인데 해냈어요',
    ],
  },
];

// 사용자가 만든 방(GENERAL_ROOM)은 방별 문구가 없다.
export const ROOM_PRAISES: Partial<Record<PraiseRoomType, string[]>> = {
  KITCHEN: ['부엌이 반짝반짝해요', '요리할 맛 나는 부엌이 됐어요'],
  BATHROOM: ['화장실이 뽀송해졌어요', '향기로운 화장실 완성!'],
  LIVING_ROOM: ['거실에 앉고 싶어지네요', '거실이 한결 넓어 보여요'],
  BEDROOM: ['오늘 밤은 더 푹 잘 수 있겠어요', '포근한 침실이 됐어요'],
  ENTRANCE: ['집에 들어올 때 기분 좋겠어요', '현관이 환해졌어요'],
};

export const DEFAULT_PRAISES: string[] = [
  '정말 잘했어요!',
  '최고예요!',
  '덕분에 집이 반짝반짝해요!',
  '오늘도 해냈어요!',
  '깔끔하게 끝냈어요',
  '역시 믿고 맡길 만해요',
  '집이 고마워하고 있어요',
  '{task}, 완벽하게 끝!',
  '한 걸음 더 깨끗해졌어요',
  '오늘의 살림왕!',
  '드디어 해냈어요!',
  '해야지 했던 걸 끝냈어요',
  '속이 다 시원해요',
];

// 상황에 맞는 후보 묶음 ({task}는 아직 치환하지 않은 원문)
export function praiseCandidates(ctx: PraiseContext): string[] {
  const situation = PRIORITY_PRAISES.find(s => s.matches(ctx));
  if (situation) {
    return situation.messages;
  }
  const roomMessages = ctx.roomType ? ROOM_PRAISES[ctx.roomType] ?? [] : [];
  return [...roomMessages, ...DEFAULT_PRAISES];
}

function fill(template: string, taskTitle: string): string {
  return template.replace('{task}', taskTitle);
}

// 후보 중 하나를 무작위로 고른다. 직전에 보여준 문구와 같으면 한 번 다시 고른다
// (그래도 같으면 바로 다음 문구로 넘긴다 — 같은 random을 넘겨도 다른 문구가 나오게).
export function pickPraise(
  ctx: PraiseContext,
  random: () => number,
  lastPraise?: string,
): string {
  const candidates = praiseCandidates(ctx);
  const at = (index: number) =>
    fill(candidates[index % candidates.length], ctx.taskTitle);
  const pickIndex = () => Math.floor(random() * candidates.length);

  let index = pickIndex();
  if (candidates.length > 1 && at(index) === lastPraise) {
    index = pickIndex();
    if (at(index) === lastPraise) {
      index += 1;
    }
  }
  return at(index);
}
