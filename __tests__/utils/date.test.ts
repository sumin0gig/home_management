import {
  computeFirstDueDate,
  computeNextDueDate,
  dueDateOnSave,
  formatDateWithWeekday,
  formatRecurrence,
  isCalendarAnchored,
  isSameRecurrence,
  type RecurrenceInput,
} from "../../src/utils/date";

// 그 날 오전 9시(기기 시간대)
function on(date: string): Date {
  return new Date( `${date}T09:00:00` );
}

function every(
  intervalValue: number,
  intervalUnit: "DAY" | "WEEK" | "MONTH",
): RecurrenceInput {
  return { recurrenceType: "INTERVAL", intervalValue, intervalUnit };
}

function weekly(weekdays: number[]): RecurrenceInput {
  return { ...every( 1, "WEEK" ), weekdays };
}

function everyMonths(
  intervalValue: number,
  monthDay?: number,
): RecurrenceInput {
  return { ...every( intervalValue, "MONTH" ), monthDay };
}

function inMonths(months: number[], monthDay?: number): RecurrenceInput {
  return { recurrenceType: "YEARLY_MONTHS", months, monthDay };
}

// 현재 기한이 due인 일을 done에 완료했을 때의 다음 기한
function next(task: RecurrenceInput, due: string, done: string): string {
  return computeNextDueDate( task, on( done ), due );
}

const everyTue = weekly( [2] );
const everyTueFri = weekly( [2, 5] );
const monthly31 = everyMonths( 1, 31 );
const monthlyLast = everyMonths( 1, -1 );
const quarterly1st = everyMonths( 3, 1 );
const marJunSep15 = inMonths( [3, 6, 9], 15 );
const marJunSep = inMonths( [3, 6, 9] );
const biweekly = every( 2, "WEEK" );

describe( "computeNextDueDate", () => {
  describe( "매주 + 요일", () => {
    test( "화요일 기한을 수요일에 하면 다음 주 화요일", () => {
      expect( next( everyTue, "2026-10-27", "2026-10-28" ) ).toBe( "2026-11-03" );
    } );

    test( "화·금 중 화요일 기한을 수요일에 하면 이번 주 금요일", () => {
      expect( next( everyTueFri, "2026-10-27", "2026-10-28" ) ).toBe( "2026-10-30" );
    } );

    test( "화·금 중 화요일 기한을 금요일도 지나 토요일에 하면 다음 주 화요일 한 번만", () => {
      expect( next( everyTueFri, "2026-10-27", "2026-10-31" ) ).toBe( "2026-11-03" );
    } );

    test( "화요일 기한을 월요일에 미리 하면 그 화요일을 한 것으로 보고 금요일", () => {
      expect( next( everyTueFri, "2026-10-27", "2026-10-26" ) ).toBe( "2026-10-30" );
    } );

    test( "기한 당일에 하면 다음 차례", () => {
      expect( next( everyTue, "2026-10-27", "2026-10-27" ) ).toBe( "2026-11-03" );
    } );
  } );

  describe( "개월 + 날짜", () => {
    test( "31일 지정: 1월 31일 다음은 2월 28일", () => {
      expect( next( monthly31, "2027-01-31", "2027-01-31" ) ).toBe( "2027-02-28" );
    } );

    test( "31일 지정: 2월 28일 다음은 28일로 굳지 않고 3월 31일", () => {
      expect( next( monthly31, "2027-02-28", "2027-02-28" ) ).toBe( "2027-03-31" );
    } );

    test( "말일 지정: 윤년 2월 29일 다음은 3월 31일", () => {
      expect( next( monthlyLast, "2028-02-29", "2028-02-29" ) ).toBe( "2028-03-31" );
    } );

    test( "3개월마다 1일: 늦게 해도 현재 기한에서 3개월 뒤", () => {
      expect( next( quarterly1st, "2026-11-01", "2026-11-05" ) ).toBe( "2027-02-01" );
    } );

    test( "3개월마다 1일: 미리 하면 원래 기한에서 3개월 뒤", () => {
      expect( next( quarterly1st, "2026-11-01", "2026-10-25" ) ).toBe( "2027-02-01" );
    } );

    test( "3개월마다 1일: 여러 차례 지나서 하면 완료한 날 이후 첫 차례", () => {
      expect( next( quarterly1st, "2026-11-01", "2027-03-10" ) ).toBe( "2027-05-01" );
    } );
  } );

  describe( "특정 달", () => {
    test( "3·6·9월 15일: 9월에 하면 해를 넘겨 다음 해 3월 15일", () => {
      expect( next( marJunSep15, "2026-09-15", "2026-09-20" ) ).toBe( "2027-03-15" );
    } );

    test( "날짜가 없으면 1일 (지금 동작과 같음)", () => {
      expect( next( marJunSep, "2027-03-01", "2027-03-20" ) ).toBe( "2027-06-01" );
    } );

    test( "미리 하면 원래 기한 다음 달로 넘어간다", () => {
      expect( next( marJunSep, "2027-06-01", "2027-05-20" ) ).toBe( "2027-09-01" );
    } );
  } );

  describe( "완료 기준 (요일·날짜 없음, 지금 동작과 같음)", () => {
    test( "2주마다: 완료한 날에서 2주 뒤", () => {
      expect( next( biweekly, "2026-10-27", "2026-10-29" ) ).toBe( "2026-11-12" );
    } );

    test( "매달: 완료한 날에서 한 달 뒤", () => {
      expect( next( every( 1, "MONTH" ), "2026-10-01", "2026-10-27" ) ).toBe(
        "2026-11-27",
      );
    } );

    test( "현재 기한 없이도 계산된다", () => {
      expect( computeNextDueDate( every( 3, "DAY" ), on( "2026-10-27" ) ) ).toBe(
        "2026-10-30",
      );
    } );
  } );
} );

describe( "computeFirstDueDate", () => {
  const tuesday = on( "2026-10-27" );

  test.each( [
    ["매주 화", everyTue, "2026-10-27"],
    ["매주 금", weekly( [5] ), "2026-10-30"],
    ["매달 1일", everyMonths( 1, 1 ), "2026-11-01"],
    ["매달 27일", everyMonths( 1, 27 ), "2026-10-27"],
    ["3개월마다 1일", quarterly1st, "2026-11-01"],
    ["3·6·9월 15일", marJunSep15, "2027-03-15"],
    ["2주마다 (완료 기준)", biweekly, "2026-10-27"],
  ] as Array<[string, RecurrenceInput, string]> )(
    "화요일에 만든 %s → %s",
    (_name, task, expected) => {
      expect( computeFirstDueDate( task, tuesday ) ).toBe( expected );
    },
  );
} );

describe( "dueDateOnSave", () => {
  const wednesday = on( "2026-10-28" );

  test( "새 일이면 오늘 포함 첫 차례", () => {
    expect( dueDateOnSave( undefined, everyTueFri, wednesday ) ).toBe( "2026-10-30" );
  } );

  test( "반복이 그대로면 null (기한 유지)", () => {
    expect( dueDateOnSave( weekly( [5, 2] ), everyTueFri, wednesday ) ).toBeNull();
  } );

  test( "반복을 바꾸면 새 설정의 오늘 포함 첫 차례", () => {
    expect( dueDateOnSave( everyTue, everyTueFri, wednesday ) ).toBe( "2026-10-30" );
  } );
} );

describe( "isCalendarAnchored", () => {
  test( "요일·날짜가 없는 간격 반복은 완료 기준", () => {
    expect( isCalendarAnchored( every( 1, "WEEK" ) ) ).toBe( false );
    expect(
      isCalendarAnchored( {
        ...every( 1, "MONTH" ),
        weekdays: null,
        monthDay: null,
      } ),
    ).toBe( false );
  } );

  test( "요일이나 날짜를 지정하면 달력 기준", () => {
    expect( isCalendarAnchored( everyTue ) ).toBe( true );
    expect( isCalendarAnchored( monthly31 ) ).toBe( true );
  } );

  test( "특정 달은 날짜가 없어도 달력 기준", () => {
    expect( isCalendarAnchored( marJunSep ) ).toBe( true );
  } );

  test( "매주가 아닌 반복에 남은 요일 값은 쓰지 않는다", () => {
    expect( isCalendarAnchored( { ...biweekly, weekdays: [2] } ) ).toBe( false );
  } );
} );

describe( "isSameRecurrence", () => {
  test( "요일 순서만 다르면 같다", () => {
    expect( isSameRecurrence( weekly( [5, 2] ), everyTueFri ) ).toBe( true );
  } );

  test( "요일이 바뀌면 다르다", () => {
    expect( isSameRecurrence( everyTue, everyTueFri ) ).toBe( false );
  } );

  test( "특정 달의 날짜 없음과 1일은 같다", () => {
    expect( isSameRecurrence( marJunSep, inMonths( [3, 6, 9], 1 ) ) ).toBe( true );
  } );

  test( "저장된 행의 null과 화면 입력의 undefined는 같다", () => {
    const row = {
      ...every( 1, "WEEK" ),
      months: null,
      weekdays: null,
      monthDay: null,
    };
    expect( isSameRecurrence( row, every( 1, "WEEK" ) ) ).toBe( true );
  } );
} );

describe( "formatRecurrence", () => {
  test.each( [
    ["매주 화·금", weekly( [2, 5] )],
    ["평일", weekly( [1, 2, 3, 4, 5] )],
    ["주말", weekly( [0, 6] )],
    ["매일", weekly( [0, 1, 2, 3, 4, 5, 6] )],
    ["매주 월·일", weekly( [0, 1] )],
    ["매달 15일", everyMonths( 1, 15 )],
    ["매달 말일", monthlyLast],
    ["3개월마다 1일", quarterly1st],
    ["3·6·9월 15일", marJunSep15],
    ["3·6·9월", marJunSep],
    ["매일", every( 1, "DAY" )],
    ["3일마다", every( 3, "DAY" )],
    ["매주", every( 1, "WEEK" )],
    ["2주마다", biweekly],
    ["매달", every( 1, "MONTH" )],
    ["2개월마다", every( 2, "MONTH" )],
  ] as Array<[string, RecurrenceInput]> )( "%s", (expected, task) => {
    expect( formatRecurrence( task ) ).toBe( expected );
  } );
} );

describe( "formatDateWithWeekday", () => {
  test( "올해면 월·일과 요일", () => {
    expect( formatDateWithWeekday( "2026-11-03", on( "2026-10-27" ) ) ).toBe(
      "11월 3일 (화)",
    );
  } );

  test( "다른 해면 연도를 붙인다", () => {
    expect( formatDateWithWeekday( "2027-03-01", on( "2026-10-27" ) ) ).toBe(
      "2027년 3월 1일 (월)",
    );
  } );
} );
