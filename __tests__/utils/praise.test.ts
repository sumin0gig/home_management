import {
  DEFAULT_PRAISES,
  PRIORITY_PRAISES,
  ROOM_PRAISES,
  pickPraise,
  praiseCandidates,
  type PraiseContext,
} from "../../src/utils/praise";

const base: PraiseContext = {
  taskTitle: "냉장고 정리",
  roomType: null,
  intervalDays: 7,
  lastOfDay: false,
  leveledUp: false,
};

function messagesOf( key: "lastOfDay" | "levelUp" | "bigTask" ): string[] {
  return PRIORITY_PRAISES.find( s => s.key === key )!.messages;
}

// 묶음 안의 모든 문구가 나오는지 random을 훑어서 확인
function allPicks( ctx: PraiseContext ): Set<string> {
  const picks = new Set<string>();
  for (let i = 0; i < 100; i++) {
    picks.add( pickPraise( ctx, () => i / 100 ) );
  }
  return picks;
}

describe( "pickPraise", () => {
  test( "오늘 마지막 할 일이면 마지막 할 일 문구", () => {
    const picks = allPicks( { ...base, lastOfDay: true } );
    picks.forEach( p => expect( messagesOf( "lastOfDay" ) ).toContain( p ) );
    expect( picks.size ).toBe( messagesOf( "lastOfDay" ).length );
  } );

  test( "레벨업이면 레벨업 문구", () => {
    allPicks( { ...base, leveledUp: true } ).forEach( p =>
      expect( messagesOf( "levelUp" ) ).toContain( p ),
    );
  } );

  test( "큰 일(30일 이상)이면 큰 일 문구", () => {
    allPicks( { ...base, intervalDays: 30 } ).forEach( p =>
      expect( messagesOf( "bigTask" ) ).toContain( p ),
    );
  } );

  test( "마지막 할 일과 레벨업이 겹치면 마지막 할 일 문구", () => {
    allPicks( { ...base, lastOfDay: true, leveledUp: true, intervalDays: 90 } ).forEach( p =>
      expect( messagesOf( "lastOfDay" ) ).toContain( p ),
    );
  } );

  test( "레벨업과 큰 일이 겹치면 레벨업 문구", () => {
    allPicks( { ...base, leveledUp: true, intervalDays: 90 } ).forEach( p =>
      expect( messagesOf( "levelUp" ) ).toContain( p ),
    );
  } );

  test( "아무 상황도 없으면 부엌은 부엌·기본 묶음에서만 나온다", () => {
    const allowed = [
      ...ROOM_PRAISES.KITCHEN!,
      ...DEFAULT_PRAISES.map( m => m.replace( "{task}", base.taskTitle ) ),
    ];
    const picks = allPicks( { ...base, roomType: "KITCHEN" } );
    picks.forEach( p => expect( allowed ).toContain( p ) );
    expect( [...picks].some( p => ROOM_PRAISES.KITCHEN!.includes( p ) ) ).toBe( true );
  } );

  test( "사용자가 만든 방(GENERAL_ROOM)은 기본 문구만", () => {
    expect( praiseCandidates( { ...base, roomType: "GENERAL_ROOM" } ) ).toEqual( DEFAULT_PRAISES );
  } );

  test( "같은 random이어도 직전 문구와 다른 문구가 나온다", () => {
    const random = () => 0.5;
    const first = pickPraise( base, random );
    const second = pickPraise( base, random, first );
    expect( second ).not.toBe( first );
  } );

  test( "{task}를 집안일 이름으로 바꾼다", () => {
    const index = DEFAULT_PRAISES.indexOf( "{task}, 완벽하게 끝!" );
    const random = () => (index + 0.5) / DEFAULT_PRAISES.length;
    expect( pickPraise( base, random ) ).toBe( "냉장고 정리, 완벽하게 끝!" );
  } );

  test( "어떤 문구에도 '밀린'이 없다", () => {
    const all = [
      ...PRIORITY_PRAISES.flatMap( s => s.messages ),
      ...Object.values( ROOM_PRAISES ).flat(),
      ...DEFAULT_PRAISES,
    ];
    all.forEach( message => expect( message ).not.toMatch( /밀린/ ) );
  } );
} );
