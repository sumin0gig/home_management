import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TaskFormScreen from "../../../src/screens/home/TaskFormScreen";
import {
  useTaskStore,
  listTaskLogs,
  listTaskItems,
} from "../../../src/store/useTaskStore";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { RoomRow } from "../../../src/store/useRoomStore";
import type {
  TaskRow,
  TaskLogRow,
  TaskItemRow,
} from "../../../src/store/useTaskStore";

jest.mock( "../../../src/store/useTaskStore", () => ( {
  ...jest.requireActual( "../../../src/store/useTaskStore" ),
  listTaskLogs: jest.fn(),
  listTaskItems: jest.fn(),
} ) );

const mockedCreateTask = jest.fn();
const mockedUpdateTask = jest.fn();
const mockedDeleteTask = jest.fn();
const mockedListTaskLogs = listTaskLogs as jest.Mock;
const mockedListTaskItems = listTaskItems as jest.Mock;

const bedroom: RoomRow = {
  id: "r1",
  familyId: "f1",
  roomType: "BEDROOM",
  label: null,
} as RoomRow;

const existingTask: TaskRow = {
  id: "c1",
  roomId: "r1",
  title: "침구 햇빛살균",
  recurrenceType: "INTERVAL",
  intervalValue: 1,
  intervalUnit: "WEEK",
  months: null,
  nextDueDate: "2000-01-01",
} as TaskRow;

const existingItems: TaskItemRow[] = [
  { id: "i1", taskId: "c1", type: "DEFAULT", content: "이불을 걷는다", ord: 0 },
  { id: "i2", taskId: "c1", type: "TIP", content: "오전 11시가 좋다", ord: 1 },
] as TaskItemRow[];

const log: TaskLogRow = {
  id: "log1",
  taskId: "c1",
  completedBy: "u1",
  completedByName: "테스트유저",
  completedAt: "2026-01-01T00:00:00.000Z",
} as TaskLogRow;

function renderCreate() {
  return render(
    <TaskFormScreen
      navigation={ createMockNavigation() }
      route={ { params: undefined } as never }
    />,
  );
}

function renderEdit() {
  return render(
    <TaskFormScreen
      navigation={ createMockNavigation() }
      route={ { params: { taskId: "c1" } } as never }
    />,
  );
}

describe( "TaskFormScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useRoomStore.setState( { rooms: [bedroom] } );
    useTaskStore.setState( {
      createTask: mockedCreateTask,
      updateTask: mockedUpdateTask,
      deleteTask: mockedDeleteTask,
    } );
    mockedListTaskLogs.mockResolvedValue( [] );
    mockedListTaskItems.mockResolvedValue( [] );
  } );

  describe( "생성 모드", () => {
    test( "방을 선택하지 않으면 저장되지 않는다", () => {
      const { getByText, getAllByDisplayValue } = renderCreate();
      fireEvent.changeText( getAllByDisplayValue( "" )[0], "새 집안일" );
      fireEvent.press( getByText( "저장" ) );
      expect( getByText( "방을 선택해주세요." ) ).toBeTruthy();
      expect( mockedCreateTask ).not.toHaveBeenCalled();
    } );

    test( "간격이 0이면 에러를 표시한다", () => {
      const { getByText, getAllByDisplayValue, getByDisplayValue } =
        renderCreate();
      fireEvent.press( getByText( "침실" ) );
      fireEvent.changeText( getAllByDisplayValue( "" )[0], "새 집안일" );
      fireEvent.changeText( getByDisplayValue( "1" ), "0" );
      fireEvent.press( getByText( "저장" ) );
      expect(
        getByText( "간격은 1 이상의 정수로 입력해주세요." ),
      ).toBeTruthy();
      expect( mockedCreateTask ).not.toHaveBeenCalled();
    } );

    test( "정상 입력 시 createTask를 호출하고 뒤로 간다", async () => {
      mockedCreateTask.mockResolvedValue( undefined );
      const navigation = createMockNavigation<"TaskForm">();
      const { getByText, getAllByDisplayValue } = render(
        <TaskFormScreen
          navigation={ navigation }
          route={ { params: undefined } as never }
        />,
      );
      fireEvent.press( getByText( "침실" ) );
      fireEvent.changeText( getAllByDisplayValue( "" )[0], "새 집안일" );
      fireEvent.press( getByText( "저장" ) );

      await waitFor( () =>
        expect( mockedCreateTask ).toHaveBeenCalledWith(
          "r1",
          expect.objectContaining( {
            title: "새 집안일",
            recurrenceType: "INTERVAL",
          } ),
        ),
      );
      expect( navigation.goBack ).toHaveBeenCalled();
    } );

    test( "방법과 TIP을 입력하면 빈 칸을 제외하고 items로 전달한다", async () => {
      mockedCreateTask.mockResolvedValue( undefined );
      const { getByText, getAllByDisplayValue, getByPlaceholderText } = render(
        <TaskFormScreen
          navigation={ createMockNavigation() }
          route={ { params: { roomId: "r1" } } as never }
        />,
      );
      fireEvent.changeText( getAllByDisplayValue( "" )[0], "새 집안일" );

      fireEvent.press( getByText( "+ 방법 추가" ) );
      fireEvent.changeText(
        getByPlaceholderText( "이 집안일을 하는 방법을 적어주세요" ),
        " 이불을 턴다 ",
      );
      fireEvent.press( getByText( "+ 방법 추가" ) );
      fireEvent.press( getByText( "+ TIP 추가" ) );
      fireEvent.changeText(
        getByPlaceholderText( "알아두면 좋은 팁을 적어주세요" ),
        "햇빛 좋은 날",
      );
      fireEvent.press( getByText( "저장" ) );

      await waitFor( () =>
        expect( mockedCreateTask ).toHaveBeenCalledWith(
          "r1",
          expect.objectContaining( {
            items: [
              { type: "DEFAULT", content: "이불을 턴다" },
              { type: "TIP", content: "햇빛 좋은 날" },
            ],
          } ),
        ),
      );
    } );
  } );

  describe( "수정 모드", () => {
    beforeEach( () => {
      useTaskStore.setState( { tasks: [existingTask] } );
    } );

    test( "기존 값을 미리 채워서 보여준다", () => {
      const { getByDisplayValue } = renderEdit();
      expect( getByDisplayValue( "침구 햇빛살균" ) ).toBeTruthy();
    } );

    test( "기존 방법과 TIP을 불러와서 보여준다", async () => {
      mockedListTaskItems.mockResolvedValue( existingItems );
      const { findByDisplayValue } = renderEdit();
      expect( await findByDisplayValue( "이불을 걷는다" ) ).toBeTruthy();
      expect( await findByDisplayValue( "오전 11시가 좋다" ) ).toBeTruthy();
    } );

    test( "불러온 방법을 수정하고 저장하면 items로 전달한다", async () => {
      mockedListTaskItems.mockResolvedValue( existingItems );
      mockedUpdateTask.mockResolvedValue( undefined );
      const { getByText, findByDisplayValue } = renderEdit();
      fireEvent.changeText(
        await findByDisplayValue( "이불을 걷는다" ),
        "이불을 턴다",
      );
      fireEvent.press( getByText( "저장" ) );

      await waitFor( () =>
        expect( mockedUpdateTask ).toHaveBeenCalledWith(
          "c1",
          expect.objectContaining( {
            items: [
              { type: "DEFAULT", content: "이불을 턴다" },
              { type: "TIP", content: "오전 11시가 좋다" },
            ],
          } ),
          "r1",
        ),
      );
    } );

    test( "안내 항목을 불러오지 못하면 items를 보내지 않아 기존 항목을 보존한다", async () => {
      mockedListTaskItems.mockRejectedValue( new Error( "불러오기 실패" ) );
      mockedUpdateTask.mockResolvedValue( undefined );
      const { getByText, findByText } = renderEdit();
      await findByText( "불러오기 실패" );
      fireEvent.press( getByText( "저장" ) );

      await waitFor( () => expect( mockedUpdateTask ).toHaveBeenCalled() );
      expect( mockedUpdateTask.mock.calls[0][1].items ).toBeUndefined();
    } );

    test( "완료 기록을 불러와서 보여준다", async () => {
      mockedListTaskLogs.mockResolvedValue( [log] );
      const { getByText } = renderEdit();
      await waitFor( () => expect( getByText( /테스트유저/ ) ).toBeTruthy() );
    } );

    test( "저장하면 updateTask를 호출한다", async () => {
      mockedUpdateTask.mockResolvedValue( undefined );
      const navigation = createMockNavigation<"TaskForm">();
      const { getByText, getByDisplayValue } = render(
        <TaskFormScreen
          navigation={ navigation }
          route={ { params: { taskId: "c1" } } as never }
        />,
      );
      fireEvent.changeText(
        getByDisplayValue( "침구 햇빛살균" ),
        "침구 햇빛살균(수정)",
      );
      fireEvent.press( getByText( "저장" ) );

      await waitFor( () =>
        expect( mockedUpdateTask ).toHaveBeenCalledWith(
          "c1",
          expect.objectContaining( { title: "침구 햇빛살균(수정)" } ),
          "r1",
        ),
      );
      expect( navigation.goBack ).toHaveBeenCalled();
    } );

    test( "삭제 버튼을 탭하면 완료 기록도 함께 삭제된다는 안내와 함께 확인을 요청한다", () => {
      const alertSpy = jest
        .spyOn( Alert, "alert" )
        .mockImplementation( () => {} );
      const navigation = createMockNavigation<"TaskForm">();
      const { getByText } = render(
        <TaskFormScreen
          navigation={ navigation }
          route={ { params: { taskId: "c1" } } as never }
        />,
      );
      fireEvent.press( getByText( "삭제" ) );

      expect( alertSpy ).toHaveBeenCalledWith(
        "집안일 삭제",
        expect.stringContaining( "완료 기록도 모두 함께 삭제" ),
        expect.any( Array ),
      );
      expect( mockedDeleteTask ).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    } );

    test( "삭제 확인을 누르면 deleteTask를 호출한다", async () => {
      mockedDeleteTask.mockResolvedValue( undefined );
      jest.spyOn( Alert, "alert" ).mockImplementation( (_t, _m, buttons) => {
        buttons?.find( b => b.style === "destructive" )?.onPress?.();
      } );
      const navigation = createMockNavigation<"TaskForm">();
      const { getByText } = render(
        <TaskFormScreen
          navigation={ navigation }
          route={ { params: { taskId: "c1" } } as never }
        />,
      );
      fireEvent.press( getByText( "삭제" ) );

      await waitFor( () =>
        expect( mockedDeleteTask ).toHaveBeenCalledWith( "c1" ),
      );
      expect( navigation.goBack ).toHaveBeenCalled();
      jest.restoreAllMocks();
    } );

    test( "삭제 취소를 누르면 deleteTask가 호출되지 않는다", () => {
      jest.spyOn( Alert, "alert" ).mockImplementation( (_t, _m, buttons) => {
        buttons?.find( b => b.style === "cancel" )?.onPress?.();
      } );
      const navigation = createMockNavigation<"TaskForm">();
      const { getByText } = render(
        <TaskFormScreen
          navigation={ navigation }
          route={ { params: { taskId: "c1" } } as never }
        />,
      );
      fireEvent.press( getByText( "삭제" ) );

      expect( mockedDeleteTask ).not.toHaveBeenCalled();
      expect( navigation.goBack ).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    } );
  } );
} );
