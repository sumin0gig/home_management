import {
  getMonthDay,
  getMonths,
  getWeekdays,
  type RecurrenceInput,
  type TaskRecurrence,
} from "../../utils/date";

// 집안일 추가·수정 화면에서 고르는 반복 설정. 화면에서 고른 그대로(칩, 스위치)를 들고
// 있다가, 저장할 때 buildRecurrence로 저장 형식(TaskRecurrence)으로 바꾼다.

export type Frequency =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "MONTHS"
  | "CUSTOM";

export type IntervalUnit = "DAY" | "WEEK" | "MONTH";

export const FREQUENCY_OPTIONS: Array<{ value: Frequency; label: string }> = [
  { value: "DAILY", label: "매일" },
  { value: "WEEKLY", label: "매주" },
  { value: "BIWEEKLY", label: "2주마다" },
  { value: "MONTHLY", label: "매달" },
  { value: "MONTHS", label: "특정 달" },
  { value: "CUSTOM", label: "직접 설정" },
];

interface Interval {
  value: number;
  unit: IntervalUnit;
}

// 칩 하나로 간격이 정해지는 주기
const PRESET_INTERVALS: Partial<Record<Frequency, Interval>> = {
  DAILY: { value: 1, unit: "DAY" },
  WEEKLY: { value: 1, unit: "WEEK" },
  BIWEEKLY: { value: 2, unit: "WEEK" },
  MONTHLY: { value: 1, unit: "MONTH" },
};

export interface RecurrenceDraft {
  frequency: Frequency;
  // 직접 설정의 간격
  customValue: string;
  customUnit: IntervalUnit;
  // 특정 달 (1~12)
  months: number[];
  // 요일 정하기 (0=일 … 6=토) — 매주일 때만 쓴다
  weekdaysOn: boolean;
  weekdays: number[];
  // 날짜 정하기 (1~31, 말일 -1) — 매달, 직접 설정의 개월, 특정 달일 때만 쓴다
  monthDayOn: boolean;
  monthDay: number | null;
}

const DEFAULT_DRAFT: RecurrenceDraft = {
  frequency: "WEEKLY",
  customValue: "1",
  customUnit: "WEEK",
  months: [],
  weekdaysOn: false,
  weekdays: [],
  monthDayOn: false,
  monthDay: null,
};

function presetFor(interval: Interval): Frequency | undefined {
  return (Object.keys( PRESET_INTERVALS ) as Frequency[]).find( frequency => {
    const preset = PRESET_INTERVALS[frequency];
    return preset?.value === interval.value && preset.unit === interval.unit;
  } );
}

// 저장된 반복 설정을 화면 입력값으로. 칩 하나와 정확히 맞으면 그 칩, 아니면 직접 설정.
export function draftFromTask(task?: RecurrenceInput): RecurrenceDraft {
  if (!task) {
    return DEFAULT_DRAFT;
  }
  const weekdays = getWeekdays( task );
  const monthDay = getMonthDay( task );
  const draft: RecurrenceDraft = {
    ...DEFAULT_DRAFT,
    weekdaysOn: weekdays.length > 0,
    weekdays,
    monthDayOn: monthDay !== null,
    monthDay,
  };
  if (task.recurrenceType === "YEARLY_MONTHS") {
    return { ...draft, frequency: "MONTHS", months: getMonths( task ) };
  }
  // 간격 단위가 비어 있으면 개월로 계산해 왔다 (computeNextDueDate와 같게)
  const interval: Interval = {
    value: task.intervalValue ?? 1,
    unit: task.intervalUnit ?? "MONTH",
  };
  return {
    ...draft,
    frequency: presetFor( interval ) ?? "CUSTOM",
    customValue: String( interval.value ),
    customUnit: interval.unit,
  };
}

// 직접 설정으로 바꾸면 방금까지 고른 간격을 입력칸에 그대로 채워 둔다.
export function selectFrequency(
  draft: RecurrenceDraft,
  frequency: Frequency,
): RecurrenceDraft {
  const preset = PRESET_INTERVALS[draft.frequency];
  if (frequency === "CUSTOM" && preset) {
    return {
      ...draft,
      frequency,
      customValue: String( preset.value ),
      customUnit: preset.unit,
    };
  }
  return { ...draft, frequency };
}

export function showsWeekdayPicker(draft: RecurrenceDraft): boolean {
  return draft.frequency === "WEEKLY";
}

export function showsMonthDayPicker(draft: RecurrenceDraft): boolean {
  return (
    draft.frequency === "MONTHLY" ||
    draft.frequency === "MONTHS" ||
    (draft.frequency === "CUSTOM" && draft.customUnit === "MONTH")
  );
}

function intervalOf(draft: RecurrenceDraft): Interval | null {
  if (draft.frequency !== "CUSTOM") {
    return PRESET_INTERVALS[draft.frequency] ?? null;
  }
  const value = Number( draft.customValue );
  return Number.isInteger( value ) && value >= 1
    ? { value, unit: draft.customUnit }
    : null;
}

function sorted(values: number[]): number[] {
  return [...values].sort( (a, b) => a - b );
}

export type BuiltRecurrence =
  | { recurrence: TaskRecurrence; error: null }
  | { recurrence: null; error: string };

function invalid(error: string): BuiltRecurrence {
  return { recurrence: null, error };
}

// 화면 입력값을 저장 형식으로. 아직 저장할 수 없으면 안내 문구를 돌려준다
// (화면 위에서부터 순서대로 확인한다).
export function buildRecurrence(draft: RecurrenceDraft): BuiltRecurrence {
  const isMonths = draft.frequency === "MONTHS";
  const interval = intervalOf( draft );
  const usesWeekdays = showsWeekdayPicker( draft ) && draft.weekdaysOn;
  const usesMonthDay = showsMonthDayPicker( draft ) && draft.monthDayOn;

  if (isMonths && draft.months.length === 0) {
    return invalid( "최소 한 달을 선택해주세요." );
  }
  if (!isMonths && !interval) {
    return invalid( "간격은 1 이상의 정수로 입력해주세요." );
  }
  if (usesWeekdays && draft.weekdays.length === 0) {
    return invalid( "요일을 하나 이상 골라주세요." );
  }
  if (usesMonthDay && draft.monthDay === null) {
    return invalid( "날짜를 골라주세요." );
  }

  const anchors: Pick<TaskRecurrence, "weekdays" | "monthDay"> = {};
  if (usesWeekdays) {
    anchors.weekdays = sorted( draft.weekdays );
  }
  if (usesMonthDay && draft.monthDay !== null) {
    anchors.monthDay = draft.monthDay;
  }

  if (!interval) {
    // 여기까지 왔으면 간격이 없는 건 특정 달뿐이다.
    return {
      recurrence: {
        recurrenceType: "YEARLY_MONTHS",
        months: sorted( draft.months ),
        ...anchors,
      },
      error: null,
    };
  }
  return {
    recurrence: {
      recurrenceType: "INTERVAL",
      intervalValue: interval.value,
      intervalUnit: interval.unit,
      ...anchors,
    },
    error: null,
  };
}
