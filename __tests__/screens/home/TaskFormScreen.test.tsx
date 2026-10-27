import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TaskFormScreen from "../../../src/screens/home/TaskFormScreen";
import { listTaskItems, listTaskLogs } from "../../../actions";
import { useTaskStore } from "../../../src/store/useTaskStore";
import { useRoomStore } from "../../../src/store/useRoomStore";
import { dueDateOnSave } from "../../../src/utils/date";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { RoomRow } from "../../../src/store/useRoomStore";
import type {
  TaskRow,
  TaskLogRow,
  TaskItemRow,
} from "../../../src/store/useTaskStore";

jest.mock( "../../../actions", () => ( {
  ...jest.requireActual( "../../../actions" ),
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

// 방 상세 화면에서 "+"로 들어오면 roomId가 params로 넘어온다 (폼에는 방 선택 UI가 없다).
function renderCreate( roomId?: string ) {
  return render(
    <TaskFormScreen
      navigation={ createMockNavigation() }
      route={ { params: roomId ? { roomId } : undefined } as never }
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

    test( "직접 설정에서 간격이 0이면 에러를 표시한다", () => {
      const { getByText, getByRole, getAllByDisplayValue, getByDisplayValue } =
        renderCreate( "r1" );
      fireEvent.changeText( getAllByDisplayValue( "" )[0], "새 집안일" );
      fireEvent.press( getByRole( "radio", { name: "직접 설정" } ) );
      fireEvent.changeText( getByDisplayValue( "1" ), "0" );
      fireEvent.press( getByText( "저장" ) );
      expect(
        getByText( "간격은 1 이상의 정수로 입력해주세요." ),
      ).toBeTruthy();
      expect( mockedCreateTask ).not.toHaveBeenCalled();
    } );

    test( "정상 입력 시 createTask를 호출하고 뒤로 간다", async () => {
      mockedCreateTask.mockResolvedValue( true );
      const navigation = createMockNavigation<"TaskForm">();
      const { getByText, getAllByDisplayValue } = render(
        <TaskFormScreen
          navigation={ navigation }
          route={ { params: { roomId: "r1" } } as never }
        />,
      );
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
      mockedCreateTask.mockResolvedValue( true );
      const { getByText, getAllByDisplayValue, getByPlaceholderText } = render(
        <TaskFormScreen
          navigation={ createMockNavigation() }
          route={ { params: { roomId: "r1" } } as never }
        />,
      );
      fireEvent.changeText( getAllByDisplayValue( "" )[0], "새 집안일" );

      fireEvent.press( getByText( "+ 방법 추가" ) );
      fireEvent.changeText(
        getByPlaceholderText( "방법 제목을 적어주세요 (줄바꿈 후 설명 입력)" ),
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
      mockedUpdateTask.mockResolvedValue( true );
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
      mockedUpdateTask.mockResolvedValue( true );
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
      mockedUpdateTask.mockResolvedValue( true );
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
      mockedDeleteTask.mockResolvedValue( true );
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

    test( "기존 3일 간격을 불러오면 직접 설정이 선택되어 있다", () => {
      useTaskStore.setState( {
        tasks: [{ ...existingTask, intervalValue: 3, intervalUnit: "DAY" }],
      } );
      const { getByRole, getByDisplayValue } = renderEdit();

      expect( getByRole( "radio", { name: "직접 설정" } ) ).toBeChecked();
      expect( getByDisplayValue( "3" ) ).toBeTruthy();
      expect( getByRole( "radio", { name: "일" } ) ).toBeChecked();
    } );

    test( "요일이 있으면 매주에 요일 정하기를 켠 채로 불러온다", () => {
      useTaskStore.setState( { tasks: [{ ...existingTask, weekdays: [2, 5] }] } );
      const { getByRole, getByLabelText } = renderEdit();

      expect( getByRole( "radio", { name: "매주" } ) ).toBeChecked();
      expect( getByLabelText( "요일 정하기" ) ).toBeChecked();
      expect( getByRole( "checkbox", { name: "화요일" } ) ).toBeChecked();
      expect( getByRole( "checkbox", { name: "금요일" } ) ).toBeChecked();
      expect( getByRole( "checkbox", { name: "수요일" } ) ).not.toBeChecked();
    } );

    test( "날짜가 있으면 매달에 날짜 정하기를 켠 채로 불러온다", () => {
      useTaskStore.setState( {
        tasks: [{ ...existingTask, intervalUnit: "MONTH", monthDay: 15 }],
      } );
      const { getByRole, getByLabelText } = renderEdit();

      expect( getByRole( "radio", { name: "매달" } ) ).toBeChecked();
      expect( getByLabelText( "날짜 정하기" ) ).toBeChecked();
      expect( getByRole( "radio", { name: "15일" } ) ).toBeChecked();
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

  describe( "반복 설정", () => {
    afterEach( () => {
      jest.useRealTimers();
    } );

    // 미리보기가 쓰는 "오늘"을 그 날 오전 9시로 고정한다.
    function setToday(date: string) {
      jest.useFakeTimers( {
        now: new Date( `${date}T09:00:00` ),
        doNotFake: ["nextTick", "queueMicrotask"],
      } );
    }

    function renderCreateWithTitle() {
      const utils = renderCreate( "r1" );
      fireEvent.changeText( utils.getAllByDisplayValue( "" )[0], "분리수거" );
      return utils;
    }

    test( "매주에서 요일 정하기를 켜고 화·금을 고르면 weekdays로 저장한다", async () => {
      mockedCreateTask.mockResolvedValue( true );
      const { getByRole, getByLabelText, getByText } = renderCreateWithTitle();
      fireEvent.press( getByRole( "radio", { name: "매주" } ) );
      fireEvent( getByLabelText( "요일 정하기" ), "valueChange", true );
      fireEvent.press( getByRole( "checkbox", { name: "화요일" } ) );
      fireEvent.press( getByRole( "checkbox", { name: "금요일" } ) );
      fireEvent.press( getByText( "저장" ) );

      await waitFor( () =>
        expect( mockedCreateTask ).toHaveBeenCalledWith(
          "r1",
          expect.objectContaining( {
            recurrenceType: "INTERVAL",
            intervalValue: 1,
            intervalUnit: "WEEK",
            weekdays: [2, 5],
          } ),
        ),
      );
    } );

    test( "2주마다를 고르면 요일 정하기가 보이지 않는다", () => {
      const { getByRole, queryByLabelText } = renderCreateWithTitle();
      expect( queryByLabelText( "요일 정하기" ) ).toBeTruthy();

      fireEvent.press( getByRole( "radio", { name: "2주마다" } ) );

      expect( queryByLabelText( "요일 정하기" ) ).toBeNull();
      expect( queryByLabelText( "날짜 정하기" ) ).toBeNull();
    } );

    test( "매달에서 날짜 정하기를 켜고 말일을 고르면 monthDay -1로 저장한다", async () => {
      mockedCreateTask.mockResolvedValue( true );
      const { getByRole, getByLabelText, getByText } = renderCreateWithTitle();
      fireEvent.press( getByRole( "radio", { name: "매달" } ) );
      fireEvent( getByLabelText( "날짜 정하기" ), "valueChange", true );
      fireEvent.press( getByRole( "radio", { name: "말일" } ) );
      fireEvent.press( getByText( "저장" ) );

      await waitFor( () =>
        expect( mockedCreateTask ).toHaveBeenCalledWith(
          "r1",
          expect.objectContaining( {
            recurrenceType: "INTERVAL",
            intervalValue: 1,
            intervalUnit: "MONTH",
            monthDay: -1,
          } ),
        ),
      );
    } );

    test( "요일 정하기를 켜고 아무 요일도 고르지 않으면 저장하지 않고 안내한다", () => {
      const { getByLabelText, getByText } = renderCreateWithTitle();
      fireEvent( getByLabelText( "요일 정하기" ), "valueChange", true );
      fireEvent.press( getByText( "저장" ) );

      expect( getByText( "요일을 하나 이상 골라주세요." ) ).toBeTruthy();
      expect( mockedCreateTask ).not.toHaveBeenCalled();
    } );

    test( "날짜 정하기를 켜고 날짜를 고르지 않으면 저장하지 않고 안내한다", () => {
      const { getByRole, getByLabelText, getByText } = renderCreateWithTitle();
      fireEvent.press( getByRole( "radio", { name: "매달" } ) );
      fireEvent( getByLabelText( "날짜 정하기" ), "valueChange", true );
      fireEvent.press( getByText( "저장" ) );

      expect( getByText( "날짜를 골라주세요." ) ).toBeTruthy();
      expect( mockedCreateTask ).not.toHaveBeenCalled();
    } );

    test( "29~31일을 고르면 그 날이 없는 달은 말일에 한다고 안내한다", () => {
      const { getByRole, getByLabelText, queryByText } =
        renderCreateWithTitle();
      fireEvent.press( getByRole( "radio", { name: "매달" } ) );
      fireEvent( getByLabelText( "날짜 정하기" ), "valueChange", true );
      fireEvent.press( getByRole( "radio", { name: "28일" } ) );
      expect( queryByText( "날짜가 없는 달은 그 달 말일에 해요" ) ).toBeNull();

      fireEvent.press( getByRole( "radio", { name: "31일" } ) );
      expect( queryByText( "날짜가 없는 달은 그 달 말일에 해요" ) ).toBeTruthy();
    } );

    test( "특정 달에서 날짜 정하기를 끄면 날짜 없이(1일) 저장한다", async () => {
      mockedCreateTask.mockResolvedValue( true );
      const { getByRole, getByText } = renderCreateWithTitle();
      fireEvent.press( getByRole( "radio", { name: "특정 달" } ) );
      fireEvent.press( getByRole( "checkbox", { name: "9월" } ) );
      fireEvent.press( getByRole( "checkbox", { name: "3월" } ) );
      fireEvent.press( getByText( "저장" ) );

      await waitFor( () => expect( mockedCreateTask ).toHaveBeenCalled() );
      const input = mockedCreateTask.mock.calls[0][1];
      expect( input ).toMatchObject( {
        recurrenceType: "YEARLY_MONTHS",
        months: [3, 9],
      } );
      expect( input.monthDay ).toBeUndefined();
    } );

    test( "추가할 때 다음 예정과 주기를 미리 보여준다", () => {
      setToday( "2026-10-27" );
      const { getByRole, getByLabelText, getByText } = renderCreateWithTitle();
      expect( getByText( "다음 예정: 10월 27일 (화)" ) ).toBeTruthy();

      fireEvent( getByLabelText( "요일 정하기" ), "valueChange", true );
      fireEvent.press( getByRole( "checkbox", { name: "금요일" } ) );

      expect( getByText( "매주 금" ) ).toBeTruthy();
      expect( getByText( "다음 예정: 10월 30일 (금)" ) ).toBeTruthy();
    } );

    describe( "수정", () => {
      // 화·금 분리수거. 화요일(10-27) 기한을 넘긴 수요일(10-28)에 연다.
      const recycling = {
        ...existingTask,
        weekdays: [2, 5],
        nextDueDate: "2026-10-27",
      } as TaskRow;

      beforeEach( () => {
        setToday( "2026-10-28" );
        useTaskStore.setState( { tasks: [recycling] } );
      } );

      test( "반복을 바꾸지 않고 이름만 바꿔 저장하면 기한이 바뀌지 않는다", async () => {
        mockedUpdateTask.mockResolvedValue( true );
        const { getByText, getByDisplayValue, queryByText } = renderEdit();
        expect( getByText( "다음 예정: 10월 27일 (화)" ) ).toBeTruthy();
        expect( queryByText( "저장하면 기한이 이 날짜로 바뀌어요" ) ).toBeNull();

        fireEvent.changeText( getByDisplayValue( "침구 햇빛살균" ), "분리수거" );
        fireEvent.press( getByText( "저장" ) );

        await waitFor( () => expect( mockedUpdateTask ).toHaveBeenCalled() );
        const input = mockedUpdateTask.mock.calls[0][1];
        expect( input ).toMatchObject( { title: "분리수거", weekdays: [2, 5] } );
        // updateTask는 이 판단으로 기한을 다시 잡을지 정한다 (null = 그대로)
        expect( dueDateOnSave( recycling, input, new Date() ) ).toBeNull();
      } );

      test( "반복을 바꾸면 새 기한과 함께 저장하면 바뀐다고 안내한다", () => {
        const { getByRole, getByText } = renderEdit();
        fireEvent.press( getByRole( "checkbox", { name: "화요일" } ) );

        expect( getByText( "매주 금" ) ).toBeTruthy();
        expect( getByText( "다음 예정: 10월 30일 (금)" ) ).toBeTruthy();
        expect( getByText( "저장하면 기한이 이 날짜로 바뀌어요" ) ).toBeTruthy();
      } );
    } );
  } );
} );
