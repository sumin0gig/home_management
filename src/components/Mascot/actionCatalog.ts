// 추억 레벨이 오르면 개방되는 마스코트 행동 목록 (도감). 개방 레벨은 배열
// 순서에서 파생된다: index * 5 + 5 (5, 10, 15, ...). 새 행동은 배열 끝에
// 추가하기만 하면 다음 개방 레벨이 자동으로 붙는다.
//
// 기본 행동(happy)은 처음부터 가능하므로 도감에 들어가지 않는다.

export type DefaultAction = "happy";

export type UnlockableAction = "wag" | "stretch" | "nap" | "eat";

export interface ActionCatalogEntry {
  action: UnlockableAction;
  label: string;
  unlockLevel: number;
}

const UNLOCK_LEVEL_STEP = 5;

export const DEFAULT_ACTIONS: DefaultAction[] = ["happy"];

const ENTRIES: Array<Omit<ActionCatalogEntry, "unlockLevel">> = [
  { action: "wag", label: "꼬리 흔들기" },
  { action: "stretch", label: "기지개" },
  { action: "nap", label: "낮잠" },
  { action: "eat", label: "식사하기" },
];

export function unlockLevelForIndex( index: number ): number {
  return ( index + 1 ) * UNLOCK_LEVEL_STEP;
}

export const ACTION_CATALOG: ActionCatalogEntry[] = ENTRIES.map(
  ( entry, index ) => ( { ...entry, unlockLevel: unlockLevelForIndex( index ) } ),
);

export function isActionUnlocked(
  entry: ActionCatalogEntry,
  level: number,
): boolean {
  return level >= entry.unlockLevel;
}

// 도감 행동 중 개방된 것만.
export function getUnlockedActions( level: number ): UnlockableAction[] {
  return ACTION_CATALOG.filter( entry => isActionUnlocked( entry, level ) ).map(
    entry => entry.action,
  );
}

// 마스코트가 실제로 할 수 있는 행동 전체 (기본 행동 + 개방된 도감 행동).
export function getPlayableActions(
  level: number,
): Array<DefaultAction | UnlockableAction> {
  return [...DEFAULT_ACTIONS, ...getUnlockedActions( level )];
}

// 아직 개방되지 않은 행동 중 가장 먼저 열리는 것. 모두 개방했으면 null.
export function getNextUnlock( level: number ): ActionCatalogEntry | null {
  return (
    ACTION_CATALOG.find( entry => !isActionUnlocked( entry, level ) ) ?? null
  );
}
