export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 'YYYY-MM-DD'를 그 날 0시(기기 시간대)로 읽는다. new Date('YYYY-MM-DD')는 UTC로
// 읽어서 시간대에 따라 하루가 어긋날 수 있으므로 쓰지 않는다.
export function parseDateString(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDueLabel(
  nextDueDate: string,
  today: string,
): string | null {
  if (nextDueDate > today) {
    const diffDays = Math.round(
      (new Date(nextDueDate).getTime() - new Date(today).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return `D-${diffDays}`;
  }
  return null;
}

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
// 요일을 보여줄 때는 월요일부터 (0=일 … 6=토)
export const WEEKDAYS_FROM_MONDAY = [1, 2, 3, 4, 5, 6, 0];
export const LAST_DAY_OF_MONTH = -1;

// "11월 3일 (화)". 올해가 아니면 앞에 연도를 붙인다.
export function formatDateWithWeekday(value: string, today: Date): string {
  const date = parseDateString(value);
  const monthDay = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return date.getFullYear() === today.getFullYear()
    ? `${monthDay} (${weekday})`
    : `${date.getFullYear()}년 ${monthDay} (${weekday})`;
}

export interface TaskItemInput {
  type: 'DEFAULT' | 'TIP';
  content: string;
}

// 집안일 추가·수정 화면에서 저장하는 반복 설정
export interface TaskRecurrence {
  recurrenceType: 'INTERVAL' | 'YEARLY_MONTHS';
  intervalValue?: number;
  intervalUnit?: 'DAY' | 'WEEK' | 'MONTH';
  months?: number[];
  // 0=일 … 6=토. 매주(INTERVAL + 1 WEEK)일 때만 쓴다.
  weekdays?: number[];
  // 1~31, 말일은 -1. INTERVAL + MONTH 또는 YEARLY_MONTHS일 때만 쓴다.
  monthDay?: number;
}

export interface TaskInput extends TaskRecurrence {
  title: string;
  // undefined면 기존 안내 항목을 건드리지 않고, 배열이면 그 내용으로 통째로 교체한다.
  items?: TaskItemInput[];
}

// 기한 계산·표기에 쓰는 반복 설정. 저장된 행(TaskRow, TaskTemplate)은 값이 null일 수
// 있으므로 그대로 넘길 수 있게 null도 받는다.
export interface RecurrenceInput {
  recurrenceType?: 'INTERVAL' | 'YEARLY_MONTHS' | null;
  intervalValue?: number | null;
  intervalUnit?: 'DAY' | 'WEEK' | 'MONTH' | null;
  months?: ReadonlyArray<number | null> | null;
  weekdays?: ReadonlyArray<number | null> | null;
  monthDay?: number | null;
}

function sortedUnique(
  values: ReadonlyArray<number | null> | null | undefined,
  isValid: (value: number) => boolean,
): number[] {
  const valid = (values ?? []).filter(
    (value): value is number => value !== null && isValid(value),
  );
  return [...new Set(valid)].sort((a, b) => a - b);
}

function intervalValueOf(task: RecurrenceInput): number {
  return task.intervalValue ?? 1;
}

// 간격 단위가 비어 있으면 개월로 계산해 왔다 (computeNextDueDate의 default).
function intervalUnitOf(task: RecurrenceInput): 'DAY' | 'WEEK' | 'MONTH' {
  return task.intervalUnit ?? 'MONTH';
}

function isYearlyMonths(task: RecurrenceInput): boolean {
  return task.recurrenceType === 'YEARLY_MONTHS';
}

export function getMonths(task: RecurrenceInput): number[] {
  return sortedUnique(
    task.months,
    m => Number.isInteger(m) && m >= 1 && m <= 12,
  );
}

// 매주 반복에 지정한 요일. 매주(1주 간격)가 아니면 값이 남아 있어도 쓰지 않는다.
export function getWeekdays(task: RecurrenceInput): number[] {
  if (
    isYearlyMonths(task) ||
    intervalUnitOf(task) !== 'WEEK' ||
    intervalValueOf(task) !== 1
  ) {
    return [];
  }
  return sortedUnique(
    task.weekdays,
    d => Number.isInteger(d) && d >= 0 && d <= 6,
  );
}

// 개월·특정 달 반복에 지정한 날짜(1~31, 말일 -1). 지정하지 않았거나 그 밖의
// 반복이면 null.
export function getMonthDay(task: RecurrenceInput): number | null {
  if (!isYearlyMonths(task) && intervalUnitOf(task) !== 'MONTH') {
    return null;
  }
  const monthDay = task.monthDay;
  if (
    monthDay === null ||
    monthDay === undefined ||
    !Number.isInteger(monthDay) ||
    (monthDay !== LAST_DAY_OF_MONTH && (monthDay < 1 || monthDay > 31))
  ) {
    return null;
  }
  return monthDay;
}

// 달력 기준이면 다음 기한을 정해진 요일·날짜에 맞추고, 아니면(완료 기준) 완료한 날에서
// 간격만큼 더한다. 특정 달 반복은 원래부터 달력 기준이다(날짜가 없으면 1일).
export function isCalendarAnchored(task: RecurrenceInput): boolean {
  return (
    isYearlyMonths(task) ||
    getWeekdays(task).length > 0 ||
    getMonthDay(task) !== null
  );
}

// 두 반복 설정이 기한 계산상 같은지. 집안일 수정에서 반복을 바꿨을 때만 기한을 다시
// 잡기 위해 쓴다.
export function isSameRecurrence(
  a: RecurrenceInput,
  b: RecurrenceInput,
): boolean {
  const key = (task: RecurrenceInput) =>
    JSON.stringify(
      isYearlyMonths(task)
        ? ['YEARLY_MONTHS', getMonths(task), getMonthDay(task) ?? 1]
        : [
            'INTERVAL',
            intervalValueOf(task),
            intervalUnitOf(task),
            getWeekdays(task),
            getMonthDay(task),
          ],
    );
  return key(a) === key(b);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const firstOfTargetMonth = new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1,
  );
  const lastDayOfTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();
  firstOfTargetMonth.setDate(Math.min(day, lastDayOfTargetMonth));
  return firstOfTargetMonth;
}

// 그 달의 monthDay일. 그 달에 없는 날(31일 등)이거나 말일(-1)이면 그 달 마지막 날.
// monthIndex는 0~11을 넘어도 된다(Date가 해를 넘겨 맞춰 준다).
function dateOnMonthDay(
  year: number,
  monthIndex: number,
  monthDay: number,
): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day =
    monthDay === LAST_DAY_OF_MONTH ? lastDay : Math.min(monthDay, lastDay);
  return new Date(year, monthIndex, day);
}

function firstWeekdayOnOrAfter(from: Date, weekdays: number[]): Date {
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDays(from, offset);
    if (weekdays.includes(candidate.getDay())) {
      return candidate;
    }
  }
  return from;
}

// months(1~12)에 든 달의 monthDay일 중 from 이후(포함) 첫 날. 해를 넘길 수 있다.
function firstMonthsDayOnOrAfter(
  from: Date,
  months: number[],
  monthDay: number,
): Date {
  for (const year of [from.getFullYear(), from.getFullYear() + 1]) {
    for (const month of months) {
      const candidate = dateOnMonthDay(year, month - 1, monthDay);
      if (candidate >= from) {
        return candidate;
      }
    }
  }
  return from;
}

// base가 있는 달에서 step개월씩 더한 달들의 monthDay일 중 from 이후(포함) 첫 날.
// 31일 지정이면 1/31 → 2/28 → 3/31처럼, 매번 이전 기한의 일이 아니라 monthDay에서
// 출발해 보정한다.
function firstStepMonthDayOnOrAfter(
  from: Date,
  base: Date,
  step: number,
  monthDay: number,
): Date {
  const monthsApart =
    (from.getFullYear() - base.getFullYear()) * 12 +
    (from.getMonth() - base.getMonth());
  let k = Math.max(0, Math.floor(monthsApart / step));
  let candidate = dateOnMonthDay(
    base.getFullYear(),
    base.getMonth() + k * step,
    monthDay,
  );
  while (candidate < from) {
    k += 1;
    candidate = dateOnMonthDay(
      base.getFullYear(),
      base.getMonth() + k * step,
      monthDay,
    );
  }
  return candidate;
}

// 달력 기준 반복에서 from 이후(포함) 첫 차례. 개월 반복은 base가 있는 달부터
// monthStep개월 간격으로 센다. 특정 달 반복에 달이 하나도 없으면 null.
function firstOccurrenceOnOrAfter(
  task: RecurrenceInput,
  from: Date,
  base: Date,
  monthStep: number,
): Date | null {
  const weekdays = getWeekdays(task);
  if (weekdays.length > 0) {
    return firstWeekdayOnOrAfter(from, weekdays);
  }
  const monthDay = getMonthDay(task) ?? 1;
  if (isYearlyMonths(task)) {
    const months = getMonths(task);
    return months.length > 0
      ? firstMonthsDayOnOrAfter(from, months, monthDay)
      : null;
  }
  return firstStepMonthDayOnOrAfter(from, base, monthStep, monthDay);
}

// 완료했을 때의 다음 기한. 기한은 완료할 때만 바뀐다 — 날짜가 지났다고 저절로 다음
// 차례로 넘기지 않으므로, 놓친 일은 완료할 때까지 지난 기한 그대로 남는다.
//
// - 완료 기준(요일·날짜 미지정 간격 반복): 완료한 날 + 간격.
// - 달력 기준: 기준일 = 완료한 날과 현재 기한(currentDue) 중 늦은 날. 그보다 뒤인 첫
//   차례가 다음 기한이다. 늦게 했으면 완료한 날 이후 첫 차례(일정이 밀리지 않음),
//   미리 했으면 원래 기한 이후 첫 차례(그 차례를 한 것으로 봄).
export function computeNextDueDate(
  task: RecurrenceInput,
  completedOn: Date,
  currentDue?: string,
): string {
  const completed = startOfDay(completedOn);

  if (!isCalendarAnchored(task)) {
    const value = intervalValueOf(task);
    switch (intervalUnitOf(task)) {
      case 'DAY':
        return toDateString(addDays(completed, value));
      case 'WEEK':
        return toDateString(addDays(completed, value * 7));
      case 'MONTH':
      default:
        return toDateString(addMonthsClamped(completed, value));
    }
  }

  const due = currentDue ? parseDateString(currentDue) : null;
  const reference = due && due > completed ? due : completed;
  const next = firstOccurrenceOnOrAfter(
    task,
    addDays(reference, 1),
    due ?? completed,
    intervalValueOf(task),
  );
  return toDateString(next ?? completed);
}

// 처음 만들 때나 반복 설정을 바꿨을 때의 기한. 달력 기준이면 오늘을 포함한 첫 차례,
// 완료 기준이면 오늘.
export function computeFirstDueDate(
  task: RecurrenceInput,
  today: Date,
): string {
  const start = startOfDay(today);
  if (!isCalendarAnchored(task)) {
    return toDateString(start);
  }
  // 개월 반복의 첫 차례는 간격과 상관없이 오늘 이후 처음 오는 그 날짜다.
  return toDateString(firstOccurrenceOnOrAfter(task, start, start, 1) ?? start);
}

function formatMonthDay(monthDay: number): string {
  return monthDay === LAST_DAY_OF_MONTH ? '말일' : `${monthDay}일`;
}

function formatWeekly(weekdays: number[]): string {
  const key = weekdays.join(',');
  if (weekdays.length === 0) {
    return '매주';
  }
  if (weekdays.length === 7) {
    return '매일';
  }
  if (key === '1,2,3,4,5') {
    return '평일';
  }
  if (key === '0,6') {
    return '주말';
  }
  const labels = WEEKDAYS_FROM_MONDAY.filter(d => weekdays.includes(d)).map(
    d => WEEKDAY_LABELS[d],
  );
  return `매주 ${labels.join('·')}`;
}

// "매주 화·금", "매달 말일", "3·6·9월 15일", "2주마다" 같은 한 줄 표기
export function formatRecurrence(task: RecurrenceInput): string {
  const monthDay = getMonthDay(task);
  const daySuffix = monthDay === null ? '' : ` ${formatMonthDay(monthDay)}`;

  if (isYearlyMonths(task)) {
    const months = getMonths(task);
    return months.length > 0 ? `${months.join('·')}월${daySuffix}` : '특정 달';
  }

  const value = intervalValueOf(task);
  switch (intervalUnitOf(task)) {
    case 'DAY':
      return value === 1 ? '매일' : `${value}일마다`;
    case 'WEEK':
      return value === 1 ? formatWeekly(getWeekdays(task)) : `${value}주마다`;
    case 'MONTH':
    default:
      return `${value === 1 ? '매달' : `${value}개월마다`}${daySuffix}`;
  }
}
