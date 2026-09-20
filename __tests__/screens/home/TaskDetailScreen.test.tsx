import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import Toast from "react-native-root-toast";
import TaskDetailScreen from "../../../src/screens/home/TaskDetailScreen";
import { useTaskStore, listTaskItems } from "../../../src/store/useTaskStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";
import type { TaskRow, TaskItemRow } from "../../../src/store/useTaskStore";

jest.mock( "../../../src/store/useTaskStore", () => ( {
  ...jest.requireActual( "../../../src/store/useTaskStore" ),
  listTaskItems: jest.fn(),
} ) );

jest.mock( "react-native-root-toast", () => ( {
  show: jest.fn(),
  durations: { SHORT: 0, LONG: 1 },
} ) );

const mockedListTaskItems = listTaskItems as jest.Mock;
const mockedCompleteTask = jest.fn();
const mockedToastShow = Toast.show as jest.Mock;

const task: TaskRow = {
  id: "c1",
  roomId: "r1",
  title: "냉장고 정리정돈",
  recurrenceType: "INTERVAL",
  intervalValue: 1,
  intervalUnit: "WEEK",
  months: null,
  nextDueDate: "2000-01-01",
} as TaskRow;

const items: TaskItemRow[] = [
  { id: "i1", taskId: "c1", type: "DEFAULT", content: "첫 번째 단계", ord: 0 },
  { id: "i2", taskId: "c1", type: "DEFAULT", content: "두 번째 단계", ord: 1 },
  { id: "i3", taskId: "c1", type: "TIP", content: "유용한 팁", ord: 2 },
] as TaskItemRow[];

function renderTaskDetailScreen(
  navigation = createMockNavigation<"TaskDetail">(),
) {
  return {
    ...render(
      <TaskDetailScreen
        navigation={ navigation }
        route={ { params: { taskId: "c1" } } as never }
      />,
    ),
    navigation,
  };
}

describe( "TaskDetailScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    resetAllStores();
    useTaskStore.setState( {
      tasks: [task],
      completeTask: mockedCompleteTask,
    } );
  } );

  test( "번호 매긴 단계와 TIP 박스를 보여준다", async () => {
    mockedListTaskItems.mockResolvedValue( items );
    const { getByText } = renderTaskDetailScreen();

    await waitFor( () => expect( getByText( "첫 번째 단계" ) ).toBeTruthy() );
    expect( getByText( "두 번째 단계" ) ).toBeTruthy();
    expect( getByText( "유용한 팁" ) ).toBeTruthy();
    expect( getByText( "TIP" ) ).toBeTruthy();
  } );

  test( "항목이 없으면 안내 문구를 보여준다", async () => {
    mockedListTaskItems.mockResolvedValue( [] );
    const { getByText } = renderTaskDetailScreen();

    await waitFor( () =>
      expect( getByText( "등록된 안내가 없습니다." ) ).toBeTruthy(),
    );
  } );

  test( "헤더의 수정 버튼을 누르면 TaskForm으로 이동한다", async () => {
    mockedListTaskItems.mockResolvedValue( [] );
    const { navigation } = renderTaskDetailScreen();

    await waitFor( () => expect( navigation.setOptions ).toHaveBeenCalled() );
    const lastOptions = (navigation.setOptions as jest.Mock).mock.calls.at(
      -1,
    )[0];
    const { getByText } = render( lastOptions.headerRight() );
    fireEvent.press( getByText( "수정" ) );

    expect( navigation.navigate ).toHaveBeenCalledWith( "TaskForm", {
      taskId: "c1",
    } );
  } );

  test( "완료 버튼을 탭하면 completeTask 후 완료 토스트를 띄우고 뒤로 간다", async () => {
    mockedListTaskItems.mockResolvedValue( [] );
    mockedCompleteTask.mockResolvedValue( undefined );
    const { getByText, navigation } = renderTaskDetailScreen();
    fireEvent.press( getByText( "완료" ) );

    await waitFor( () =>
      expect( mockedCompleteTask ).toHaveBeenCalledWith( task ),
    );
    expect( mockedToastShow ).toHaveBeenCalledWith(
      "완료되었습니다",
      expect.objectContaining( { duration: Toast.durations.SHORT } ),
    );
    expect( navigation.goBack ).toHaveBeenCalled();
  } );

  test( "존재하지 않는 집안일이면 안내 문구를 보여준다", () => {
    useTaskStore.setState( { tasks: [] } );
    mockedListTaskItems.mockResolvedValue( [] );
    const { getByText } = renderTaskDetailScreen();

    expect( getByText( "집안일을 찾을 수 없습니다." ) ).toBeTruthy();
  } );
} );
