import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import CompleteCheckScreen, {
  PRAISE_MESSAGES,
} from "../../../src/screens/home/CompleteCheckScreen";
import { ACTIONS } from "../../../src/components/Mascot/actions";
import Mascot from "../../../src/components/Mascot/Mascot";
import { useTaskStore, type TaskRow } from "../../../src/store/useTaskStore";
import {
  useMascotStore,
  type MascotRow,
} from "../../../src/store/useMascotStore";
import { resetAllStores } from "../../../src/test-utils/resetStores";
import { createMockNavigation } from "../../../src/test-utils/navigation";

const task: TaskRow = {
  id: "c1",
  roomId: "r1",
  title: "냉장고 정리정돈",
  recurrenceType: "INTERVAL",
  intervalValue: 1,
  intervalUnit: "WEEK",
  months: null,
  nextDueDate: "2000-01-08",
} as TaskRow;

const mascot: MascotRow = {
  id: "m1",
  userId: "u1",
  earStyle: "ROUND",
  tailStyle: "STRAIGHT",
  happiness: 150,
} as MascotRow;

function renderCompleteCheckScreen(
  navigation = createMockNavigation<"CompleteCheck">(),
) {
  return {
    ...render(
      <CompleteCheckScreen
        navigation={ navigation }
        route={ { params: { taskId: "c1" } } as never }
      />,
    ),
    navigation,
  };
}

describe( "CompleteCheckScreen", () => {
  beforeEach( () => {
    resetAllStores();
    useMascotStore.getState().reset();
    useTaskStore.setState( { tasks: [task] } );
    useMascotStore.setState( { status: "created", mascot } );
  } );

  test( "칭찬 문구, 완료한 집안일, 얻은 추억을 보여준다", () => {
    const { getByText, queryAllByText } = renderCompleteCheckScreen();

    const praises = PRAISE_MESSAGES.flatMap( message => queryAllByText( message ) );
    expect( praises ).toHaveLength( 1 );
    expect( getByText( "냉장고 정리정돈 완료" ) ).toBeTruthy();
    expect( getByText( "추억 +7" ) ).toBeTruthy();
  } );

  test( "마스코트는 happy 점프를 끝내면 잠깐 쉬었다가 다시 기뻐한다", () => {
    jest.useFakeTimers();
    try {
      const { UNSAFE_getByType } = renderCompleteCheckScreen();
      expect( UNSAFE_getByType( Mascot ).props.action ).toBe( "happy" );

      act( () => {
        jest.advanceTimersByTime( ACTIONS.happy.duration ?? 0 );
      } );
      expect( UNSAFE_getByType( Mascot ).props.action ).toBe( "idle" );

      act( () => {
        jest.advanceTimersByTime( 500 );
      } );
      expect( UNSAFE_getByType( Mascot ).props.action ).toBe( "happy" );
    } finally {
      jest.useRealTimers();
    }
  } );

  test( "마스코트가 없으면 마스코트와 추억 대신 칭찬만 보여준다", () => {
    useMascotStore.setState( { status: "none", mascot: null } );
    const { getByText, queryByText, UNSAFE_queryByType } =
      renderCompleteCheckScreen();

    expect( UNSAFE_queryByType( Mascot ) ).toBeNull();
    expect( queryByText( /추억/ ) ).toBeNull();
    expect( getByText( "냉장고 정리정돈 완료" ) ).toBeTruthy();
  } );

  test( "확인을 누르면 뒤로 간다", () => {
    const { getByText, navigation } = renderCompleteCheckScreen();
    fireEvent.press( getByText( "확인" ) );

    expect( navigation.goBack ).toHaveBeenCalled();
  } );
} );
