import { computeHappinessGain } from "../../src/utils/happiness";
import type { RecurrenceInput } from "../../src/utils/date";

type GainCase = [string, RecurrenceInput, number];

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

function every(
  intervalValue: number,
  intervalUnit: "DAY" | "WEEK" | "MONTH",
  extra: Partial<RecurrenceInput> = {},
): RecurrenceInput {
  return { recurrenceType: "INTERVAL", intervalValue, intervalUnit, ...extra };
}

describe( "computeHappinessGain", () => {
  test.each( [
    ["매주 화·금 → 회당 4", every( 1, "WEEK", { weekdays: [2, 5] } ), 4],
    ["매주 하루 → 7", every( 1, "WEEK", { weekdays: [2] } ), 7],
    ["매주 모든 요일 → 1", every( 1, "WEEK", { weekdays: ALL_WEEKDAYS } ), 1],
    ["매주 (요일 없음) → 7", every( 1, "WEEK" ), 7],
    ["2주마다 → 14", every( 2, "WEEK" ), 14],
    ["3일마다 → 3", every( 3, "DAY" ), 3],
    ["매달 15일 → 30", every( 1, "MONTH", { monthDay: 15 } ), 30],
    ["3개월마다 1일 → 90", every( 3, "MONTH", { monthDay: 1 } ), 90],
    [
      "3·6·9월 15일 → 365 / 3",
      { recurrenceType: "YEARLY_MONTHS", months: [3, 6, 9], monthDay: 15 },
      122,
    ],
  ] as GainCase[] )( "%s", (_name, task, expected) => {
    expect( computeHappinessGain( task ) ).toBe( expected );
  } );
} );
