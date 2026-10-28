import { useTaskStore, type TaskRow } from "../../src/store/useTaskStore";
import { useMascotStore } from "../../src/store/useMascotStore";
import { toDateString } from "../../src/utils/date";
import {
  fetchDisplayName,
  getCurrentAuthUser,
  listRoomsForFamily,
  listTasksForRoom,
} from "../../actions";

const mockTaskCreate = jest.fn();
const mockTaskUpdate = jest.fn();
const mockTaskLogCreate = jest.fn();
const mockAddHappiness = jest.fn();

jest.mock( "aws-amplify/data", () => ( {
  generateClient: () => ( {
    models: {
      Task: {
        create: (...args: unknown[]) => mockTaskCreate( ...args ),
        update: (...args: unknown[]) => mockTaskUpdate( ...args ),
      },
      TaskLog: {
        create: (...args: unknown[]) => mockTaskLogCreate( ...args ),
      },
    },
  } ),
} ) );

jest.mock( "../../actions", () => ( {
  ...jest.requireActual( "../../actions" ),
  getCurrentAuthUser: jest.fn(),
  fetchDisplayName: jest.fn(),
  listRoomsForFamily: jest.fn(),
  listTasksForRoom: jest.fn(),
} ) );

// 화·금 분리수거. 기한은 2026-10-27 (화)
const recycling: TaskRow = {
  id: "t1",
  roomId: "r1",
  title: "분리수거",
  recurrenceType: "INTERVAL",
  intervalValue: 1,
  intervalUnit: "WEEK",
  months: null,
  weekdays: [2, 5],
  monthDay: null,
  nextDueDate: "2026-10-27",
} as TaskRow;

// 그 날 오전 9시를 "지금"으로 고정한다.
function setToday(date: string) {
  jest.useFakeTimers( {
    now: new Date( `${date}T09:00:00` ),
    doNotFake: ["nextTick", "queueMicrotask"],
  } );
}

function lastUpdatePayload() {
  return mockTaskUpdate.mock.calls[mockTaskUpdate.mock.calls.length - 1][0];
}

describe( "useTaskStore 반복 기한", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    useTaskStore.getState().reset();
    useMascotStore.setState( { addHappiness: mockAddHappiness } );
    mockTaskCreate.mockImplementation( input =>
      Promise.resolve( { data: { id: "new", ...input }, errors: undefined } ),
    );
    mockTaskUpdate.mockResolvedValue( { data: {}, errors: undefined } );
    mockTaskLogCreate.mockResolvedValue( { data: {}, errors: undefined } );
    ( getCurrentAuthUser as jest.Mock ).mockResolvedValue( { userId: "u1" } );
    ( fetchDisplayName as jest.Mock ).mockResolvedValue( "테스트유저" );
  } );

  afterEach( () => {
    jest.useRealTimers();
  } );

  describe( "createTask", () => {
    test( "요일을 지정하면 오늘 포함 첫 차례가 첫 기한이다", async () => {
      setToday( "2026-10-27" );
      await expect(
        useTaskStore.getState().createTask( "r1", {
          title: "분리수거",
          recurrenceType: "INTERVAL",
          intervalValue: 1,
          intervalUnit: "WEEK",
          weekdays: [5],
        } ),
      ).resolves.toBe( true );

      expect( mockTaskCreate ).toHaveBeenCalledWith(
        expect.objectContaining( { weekdays: [5], nextDueDate: "2026-10-30" } ),
      );
    } );

    test( "요일·날짜가 없으면 지금처럼 오늘이 첫 기한이다", async () => {
      setToday( "2026-10-27" );
      await useTaskStore.getState().createTask( "r1", {
        title: "환기",
        recurrenceType: "INTERVAL",
        intervalValue: 3,
        intervalUnit: "DAY",
      } );

      expect( mockTaskCreate ).toHaveBeenCalledWith(
        expect.objectContaining( { nextDueDate: "2026-10-27" } ),
      );
    } );
  } );

  describe( "updateTask", () => {
    beforeEach( () => {
      useTaskStore.setState( { tasks: [recycling] } );
    } );

    test( "이름만 바꾸면 기한을 건드리지 않는다", async () => {
      setToday( "2026-10-28" );
      await expect(
        useTaskStore.getState().updateTask( "t1", {
          title: "분리수거(재활용)",
          recurrenceType: "INTERVAL",
          intervalValue: 1,
          intervalUnit: "WEEK",
          weekdays: [2, 5],
        } ),
      ).resolves.toBe( true );

      expect( lastUpdatePayload() ).toMatchObject( { title: "분리수거(재활용)" } );
      expect( lastUpdatePayload() ).not.toHaveProperty( "nextDueDate" );
    } );

    test( "반복을 바꾸면 새 설정의 오늘 포함 첫 차례로 기한을 다시 잡는다", async () => {
      setToday( "2026-10-28" );
      await useTaskStore.getState().updateTask( "t1", {
        title: "분리수거",
        recurrenceType: "INTERVAL",
        intervalValue: 1,
        intervalUnit: "WEEK",
        weekdays: [3],
      } );

      expect( lastUpdatePayload() ).toMatchObject( {
        weekdays: [3],
        monthDay: null,
        nextDueDate: "2026-10-28",
      } );
    } );

    test( "요일을 끄면 저장된 요일을 지운다", async () => {
      setToday( "2026-10-28" );
      await useTaskStore.getState().updateTask( "t1", {
        title: "분리수거",
        recurrenceType: "INTERVAL",
        intervalValue: 1,
        intervalUnit: "WEEK",
      } );

      expect( lastUpdatePayload() ).toMatchObject( {
        weekdays: null,
        nextDueDate: "2026-10-28",
      } );
    } );
  } );

  describe( "completeTask", () => {
    test( "화요일 기한을 수요일에 완료하면 이번 주 금요일이 다음 기한이다", async () => {
      setToday( "2026-10-28" );
      await expect(
        useTaskStore.getState().completeTask( recycling ),
      ).resolves.toBe( true );

      expect( mockTaskUpdate ).toHaveBeenCalledWith( {
        id: "t1",
        nextDueDate: "2026-10-30",
      } );
      // 화·금 두 요일 → 회당 Math.round( 7 / 2 )
      expect( mockAddHappiness ).toHaveBeenCalledWith( 4 );
    } );
  } );

  describe( "기한은 완료할 때만 바뀐다", () => {
    test( "완료하지 않은 화요일 일을 수요일에 불러와도 기한은 화요일이고 할 일에 포함된다", async () => {
      setToday( "2026-10-28" );
      ( listRoomsForFamily as jest.Mock ).mockResolvedValue( [{ id: "r1" }] );
      ( listTasksForRoom as jest.Mock ).mockResolvedValue( [recycling] );

      await useTaskStore.getState().fetchTasksForFamily( "f1" );

      const { tasks } = useTaskStore.getState();
      expect( tasks[0].nextDueDate ).toBe( "2026-10-27" );
      expect( mockTaskUpdate ).not.toHaveBeenCalled();
      // 홈의 할 일 판정과 같은 조건 (HomeScreen hasDueToday, TaskCard isDue)
      const today = toDateString( new Date() );
      expect( tasks.filter( t => t.nextDueDate <= today ) ).toEqual( [recycling] );
    } );
  } );
} );

describe( "useTaskStore 조용한 새로고침", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    useTaskStore.getState().reset();
    useMascotStore.setState( { addHappiness: mockAddHappiness } );
    mockTaskUpdate.mockResolvedValue( { data: {}, errors: undefined } );
    mockTaskLogCreate.mockResolvedValue( { data: {}, errors: undefined } );
    ( getCurrentAuthUser as jest.Mock ).mockResolvedValue( { userId: "u1" } );
    ( fetchDisplayName as jest.Mock ).mockResolvedValue( "테스트유저" );
    ( listRoomsForFamily as jest.Mock ).mockResolvedValue( [{ id: "r1" }] );
  } );

  afterEach( () => {
    jest.useRealTimers();
  } );

  test( "refreshTasksForFamily는 status를 loading으로 바꾸지 않는다", async () => {
    useTaskStore.setState( { status: "loaded", tasks: [] } );
    const statuses: string[] = [];
    const unsubscribe = useTaskStore.subscribe( state => statuses.push( state.status ) );
    ( listTasksForRoom as jest.Mock ).mockResolvedValue( [recycling] );

    const pending = useTaskStore.getState().refreshTasksForFamily( "f1" );
    expect( useTaskStore.getState().isRefreshing ).toBe( true );
    await pending;
    unsubscribe();

    expect( statuses ).not.toContain( "loading" );
    expect( useTaskStore.getState().isRefreshing ).toBe( false );
    expect( useTaskStore.getState().tasks ).toEqual( [recycling] );
  } );

  test( "새로고침이 실패해도 목록은 그대로 두고 error만 채운다", async () => {
    useTaskStore.setState( { status: "loaded", tasks: [recycling] } );
    ( listTasksForRoom as jest.Mock ).mockRejectedValue( new Error( "네트워크 오류" ) );

    await expect( useTaskStore.getState().refreshTasksForFamily( "f1" ) ).resolves.toBeUndefined();

    expect( useTaskStore.getState().tasks ).toEqual( [recycling] );
    expect( useTaskStore.getState().error ).toBe( "네트워크 오류" );
    expect( useTaskStore.getState().isRefreshing ).toBe( false );
  } );

  test( "completeTask가 true를 돌려준 시점에 스토어의 기한이 이미 새 값이다", async () => {
    setToday( "2026-10-28" );
    useTaskStore.setState( { status: "loaded", tasks: [recycling], currentFamilyId: "f1" } );
    // 뒤에서 도는 전체 새로고침은 끝나지 않게 둔다 — 그래도 기한은 바뀌어 있어야 한다.
    ( listRoomsForFamily as jest.Mock ).mockReturnValue( new Promise( () => {} ) );

    await expect( useTaskStore.getState().completeTask( recycling ) ).resolves.toBe( true );

    expect( useTaskStore.getState().tasks[0].nextDueDate ).toBe( "2026-10-30" );
    expect( useTaskStore.getState().status ).toBe( "loaded" );
    expect( mockAddHappiness ).toHaveBeenCalled();
    expect( listRoomsForFamily ).toHaveBeenCalledWith( "f1" );
  } );
} );
