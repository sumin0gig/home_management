import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TaskFormScreen from "../../../src/screens/home/TaskFormScreen";
import { useTaskStore, listTaskLogs } from "../../../src/store/useTaskStore";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { RoomRow } from "../../../src/store/useRoomStore";
import type { TaskRow, TaskLogRow } from "../../../src/store/useTaskStore";

jest.mock( "../../../src/store/useTaskStore", () => ( {
  ...jest.requireActual( "../../../src/store/useTaskStore" ),
  listTaskLogs: jest.fn(),
} ) );

const mockedCreateTask = jest.fn();
const mockedUpdateTask = jest.fn();
const mockedDeleteTask = jest.fn();
const mockedListTaskLogs = listTaskLogs as jest.Mock;

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
  description: "침구, 베개 등 햇빛살균",
  recurrenceType: "INTERVAL",
  intervalValue: 1,
  intervalUnit: "WEEK",
  months: null,
  nextDueDate: "2000-01-01",
} as TaskRow;

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
      expect( getByText( "간격은 1 이상의 정수로 입력해주세요." ) ).toBeTruthy();
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
  } );

  describe( "수정 모드", () => {
    beforeEach( () => {
      useTaskStore.setState( { tasks: [existingTask] } );
    } );

    test( "기존 값을 미리 채워서 보여준다", () => {
      const { getByDisplayValue } = renderEdit();
      expect( getByDisplayValue( "침구 햇빛살균" ) ).toBeTruthy();
      expect( getByDisplayValue( "침구, 베개 등 햇빛살균" ) ).toBeTruthy();
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
      const alertSpy = jest.spyOn( Alert, "alert" ).mockImplementation( () => {} );
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
