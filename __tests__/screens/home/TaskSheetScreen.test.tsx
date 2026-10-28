import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TaskSheetScreen from "../../../src/screens/home/TaskSheetScreen";
import { listTaskItems, listTaskLogs } from "../../../actions";
import { useTaskStore } from "../../../src/store/useTaskStore";
import { useRoomStore } from "../../../src/store/useRoomStore";
import {
  useMascotStore,
  type MascotRow,
} from "../../../src/store/useMascotStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import { toDateString } from "../../../src/utils/date";
import type { RoomRow } from "../../../src/store/useRoomStore";
import type {
  TaskRow,
  TaskItemRow,
  TaskLogRow,
} from "../../../src/store/useTaskStore";

jest.mock( "../../../actions", () => ( {
  ...jest.requireActual( "../../../actions" ),
  listTaskItems: jest.fn(),
  listTaskLogs: jest.fn(),
} ) );

const mockedListTaskItems = listTaskItems as jest.Mock;
const mockedListTaskLogs = listTaskLogs as jest.Mock;
const mockedCompleteTask = jest.fn();

// 오늘에서 days만큼 떨어진 날 ('YYYY-MM-DD')
function daysFromToday( days: number ): string {
  const date = new Date();
  date.setDate( date.getDate() + days );
  return toDateString( date );
}

const task: TaskRow = {
  id: "c1",
  roomId: "r1",
  title: "냉장고 정리정돈",
  recurrenceType: "INTERVAL",
  intervalValue: 1,
  intervalUnit: "WEEK",
  months: null,
  nextDueDate: daysFromToday( -3 ),
} as TaskRow;

const room: RoomRow = {
  id: "r1",
  familyId: "f1",
  roomType: "BATHROOM",
  label: null,
  color: "#A9DDF2",
} as RoomRow;

const items: TaskItemRow[] = [
  { id: "i1", taskId: "c1", type: "DEFAULT", content: "첫 번째 단계", ord: 0 },
  { id: "i2", taskId: "c1", type: "DEFAULT", content: "두 번째 단계", ord: 1 },
  { id: "i3", taskId: "c1", type: "TIP", content: "유용한 팁", ord: 2 },
] as TaskItemRow[];

const logs: TaskLogRow[] = [
  {
    id: "l1",
    taskId: "c1",
    completedBy: "u1",
    completedByName: "수민",
    completedAt: new Date( 2026, 9, 16, 12 ).toISOString(),
  },
  {
    id: "l2",
    taskId: "c1",
    completedBy: "u2",
    completedByName: "민수",
    completedAt: new Date( 2026, 9, 9, 12 ).toISOString(),
  },
] as TaskLogRow[];

function renderSheet( navigation = createMockNavigation<"TaskSheet">() ) {
  return {
    ...render(
      <TaskSheetScreen
        navigation={ navigation }
        route={ { params: { taskId: "c1" } } as never }
      />,
    ),
    navigation,
  };
}

// 완료하면 스토어의 기한을 다음 기한으로 바꾸는 completeTask 흉내
function completeMovesDueDateTo( nextDueDate: string ) {
  mockedCompleteTask.mockImplementation( ( completed: TaskRow ) => {
    useTaskStore.setState( {
      tasks: useTaskStore
      .getState()
      .tasks.map( t => ( t.id === completed.id ? { ...t, nextDueDate } : t ) ),
    } );
    return Promise.resolve( true );
  } );
}

describe( "TaskSheetScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useMascotStore.getState().reset();
    useRoomStore.setState( { rooms: [room] } );
    useTaskStore.setState( {
      tasks: [task],
      completeTask: mockedCompleteTask,
    } );
    mockedListTaskItems.mockResolvedValue( items );
    mockedListTaskLogs.mockResolvedValue( logs );
  } );

  test( "방 배지, 상태 라벨, 방법, TIP, 완료 기록, 마지막 완료 줄을 그린다", async () => {
    const { getByText, getByTestId } = renderSheet();

    await waitFor( () => expect( getByText( "첫 번째 단계" ) ).toBeTruthy() );
    expect( getByText( "두 번째 단계" ) ).toBeTruthy();
    expect( getByText( "유용한 팁" ) ).toBeTruthy();
    expect( getByText( "완료 기록" ) ).toBeTruthy();
    expect( getByText( "3일 지남" ) ).toBeTruthy();
    // 방 이름만, "청소"를 붙이지 않는다
    expect( getByTestId( "room-badge" ) ).toHaveTextContent( "화장실" );
    expect( getByTestId( "room-badge" ) ).not.toHaveTextContent( /청소/ );
    expect( getByText( /마지막 완료 10월 16일 · 수민/ ) ).toBeTruthy();
    expect( getByText( /10월 9일 \(.\) · 민수/ ) ).toBeTruthy();
    // 최근 10개를 불러온다
    expect( mockedListTaskLogs ).toHaveBeenCalledWith( "c1", 10 );
  } );

  test( "방법이 없으면 안내 문구, 기록이 없으면 '아직 완료 기록이 없어요'", async () => {
    mockedListTaskItems.mockResolvedValue( [] );
    mockedListTaskLogs.mockResolvedValue( [] );
    const { getByText, getAllByText } = renderSheet();

    await waitFor( () =>
      expect(
        getByText( "등록된 방법이 없어요. 수정에서 추가할 수 있어요." ),
      ).toBeTruthy(),
    );
    expect( getAllByText( /아직 완료 기록이 없어요/ ).length ).toBeGreaterThan( 0 );
  } );

  test( "✕와 어두운 막을 누르면 닫힌다(goBack)", async () => {
    const { getByLabelText, getByTestId, navigation } = renderSheet();
    await waitFor( () => expect( mockedListTaskItems ).toHaveBeenCalled() );

    // 시트가 accessibilityViewIsModal이라 뒤의 막은 화면 읽기 대상에서 빠진다
    fireEvent.press( getByTestId( "sheet-overlay", { includeHiddenElements: true } ) );
    fireEvent.press( getByLabelText( "닫기" ) );

    expect( navigation.goBack ).toHaveBeenCalledTimes( 2 );
  } );

  test( "'수정'을 누르면 TaskForm으로 replace", async () => {
    const { getByText, navigation } = renderSheet();
    await waitFor( () => expect( mockedListTaskItems ).toHaveBeenCalled() );

    fireEvent.press( getByText( "수정" ) );

    expect( navigation.replace ).toHaveBeenCalledWith( "TaskForm", { taskId: "c1" } );
  } );

  test( "오늘의 마지막 할 일을 완료하면 variant 'full'로 CompleteCheck에 replace", async () => {
    useMascotStore.setState( { mascot: { id: "m1", happiness: 40 } as MascotRow } );
    completeMovesDueDateTo( daysFromToday( 4 ) );
    const { getByText, navigation } = renderSheet();

    fireEvent.press( getByText( "완료" ) );

    await waitFor( () =>
      expect( navigation.replace ).toHaveBeenCalledWith( "CompleteCheck", {
        taskId: "c1",
        happinessBefore: 40,
        previousDueDate: task.nextDueDate,
        variant: "full",
      } ),
    );
    expect( mockedCompleteTask ).toHaveBeenCalledWith( task );
  } );

  test( "다른 할 일이 남아 있으면 variant 'light'", async () => {
    const other = { ...task, id: "c2", title: "빨래", nextDueDate: daysFromToday( 0 ) } as TaskRow;
    useTaskStore.setState( { tasks: [task, other] } );
    completeMovesDueDateTo( daysFromToday( 4 ) );
    const { getByText, navigation } = renderSheet();

    fireEvent.press( getByText( "완료" ) );

    await waitFor( () =>
      expect( navigation.replace ).toHaveBeenCalledWith(
        "CompleteCheck",
        expect.objectContaining( { variant: "light" } ),
      ),
    );
  } );

  test( "기한 전(이번 주) 일을 완료하면 다른 할 일이 0개여도 'light'", async () => {
    const upcoming = { ...task, nextDueDate: daysFromToday( 3 ) } as TaskRow;
    useTaskStore.setState( { tasks: [upcoming] } );
    completeMovesDueDateTo( daysFromToday( 10 ) );
    const { getByText, navigation } = renderSheet();

    fireEvent.press( getByText( "완료" ) );

    await waitFor( () =>
      expect( navigation.replace ).toHaveBeenCalledWith(
        "CompleteCheck",
        expect.objectContaining( {
          previousDueDate: upcoming.nextDueDate,
          variant: "light",
        } ),
      ),
    );
  } );

  test( "완료 요청 중에 다시 눌러도 completeTask는 한 번만 불리고 버튼은 '완료 중…'", async () => {
    let finish: ( ok: boolean ) => void = () => {};
    mockedCompleteTask.mockImplementation(
      () => new Promise<boolean>( resolve => {
        finish = resolve;
      } ),
    );
    const { getByText, navigation } = renderSheet();

    fireEvent.press( getByText( "완료" ) );
    fireEvent.press( getByText( "완료 중…" ) );

    expect( mockedCompleteTask ).toHaveBeenCalledTimes( 1 );
    finish( true );
    await waitFor( () => expect( navigation.replace ).toHaveBeenCalled() );
  } );

  test( "완료에 실패하면 버튼을 되돌리고 시트 안에 오류를 보여준다", async () => {
    mockedCompleteTask.mockImplementation( () => {
      useTaskStore.setState( { error: "완료 처리에 실패했습니다." } );
      return Promise.resolve( false );
    } );
    const { getByText, navigation } = renderSheet();

    fireEvent.press( getByText( "완료" ) );

    await waitFor( () =>
      expect( getByText( "완료 처리에 실패했습니다." ) ).toBeTruthy(),
    );
    expect( getByText( "완료" ) ).toBeTruthy();
    expect( navigation.replace ).not.toHaveBeenCalled();
  } );
} );
