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

function setHappinessAfter( happiness: number ) {
  useMascotStore.setState( {
    status: "created",
    mascot: {
      id: "m1",
      userId: "u1",
      earStyle: "ROUND",
      tailStyle: "STRAIGHT",
      happiness,
    } as MascotRow,
  } );
}

function renderCompleteCheckScreen( happinessBefore?: number ) {
  const navigation = createMockNavigation<"CompleteCheck">();
  return {
    ...render(
      <CompleteCheckScreen
        navigation={ navigation }
        route={ { params: { taskId: "c1", happinessBefore } } as never }
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
  } );

  test( "칭찬 문구, 완료한 집안일, 실제로 오른 추억을 보여준다", () => {
    setHappinessAfter( 150 );
    const { getByText, queryAllByText, queryByTestId } =
      renderCompleteCheckScreen( 143 );

    const praises = PRAISE_MESSAGES.flatMap( message => queryAllByText( message ) );
    expect( praises ).toHaveLength( 1 );
    expect( getByText( "냉장고 정리정돈 완료" ) ).toBeTruthy();
    expect( getByText( "추억 +7" ) ).toBeTruthy();
    expect( queryByTestId( "level-up" ) ).toBeNull();
  } );

  test( "추억 저장에 실패해 값이 그대로면 얻은 추억을 보여주지 않는다", () => {
    setHappinessAfter( 143 );
    const { getByText, queryByText } = renderCompleteCheckScreen( 143 );

    expect( getByText( "냉장고 정리정돈 완료" ) ).toBeTruthy();
    expect( queryByText( /추억/ ) ).toBeNull();
  } );

  test( "레벨이 오르면 레벨 업과 바뀐 레벨을 보여준다", () => {
    setHappinessAfter( 102 );
    const { getByText, queryByText } = renderCompleteCheckScreen( 95 );

    expect( getByText( "레벨 업!" ) ).toBeTruthy();
    expect( getByText( "추억 Lv. 1 → 2" ) ).toBeTruthy();
    expect( queryByText( "새로 열린 행동" ) ).toBeNull();
  } );

  test( "레벨 업으로 행동이 열리면 행동 이름을 보여준다", () => {
    setHappinessAfter( 537 );
    const { getByText } = renderCompleteCheckScreen( 530 );

    expect( getByText( "추억 Lv. 4 → 5" ) ).toBeTruthy();
    expect( getByText( "새로 열린 행동" ) ).toBeTruthy();
    expect( getByText( "꼬리 흔들기" ) ).toBeTruthy();
  } );

  test( "마스코트는 happy 점프를 끝내면 잠깐 쉬었다가 다시 기뻐한다", () => {
    jest.useFakeTimers();
    try {
      setHappinessAfter( 150 );
      const { UNSAFE_getByType } = renderCompleteCheckScreen( 143 );
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

  test( "새로 열린 행동이 있으면 happy와 번갈아 보여준다", () => {
    jest.useFakeTimers();
    try {
      setHappinessAfter( 537 );
      const { UNSAFE_getByType } = renderCompleteCheckScreen( 530 );
      // 행동 하나를 끝까지 재생하고, 쉬는 시간을 거쳐 다음 행동으로 넘어간다.
      const playThrough = ( action: keyof typeof ACTIONS ) => {
        act( () => {
          jest.advanceTimersByTime( ACTIONS[action].duration ?? 0 );
        } );
        act( () => {
          jest.advanceTimersByTime( 500 );
        } );
      };
      expect( UNSAFE_getByType( Mascot ).props.action ).toBe( "happy" );

      playThrough( "happy" );
      expect( UNSAFE_getByType( Mascot ).props.action ).toBe( "wag" );

      playThrough( "wag" );
      expect( UNSAFE_getByType( Mascot ).props.action ).toBe( "happy" );
    } finally {
      jest.useRealTimers();
    }
  } );

  test( "마스코트가 없으면 마스코트와 추억 대신 칭찬만 보여준다", () => {
    const { getByText, queryByText, UNSAFE_queryByType } =
      renderCompleteCheckScreen();

    expect( UNSAFE_queryByType( Mascot ) ).toBeNull();
    expect( queryByText( /추억/ ) ).toBeNull();
    expect( queryByText( "레벨 업!" ) ).toBeNull();
    expect( getByText( "냉장고 정리정돈 완료" ) ).toBeTruthy();
  } );

  test( "확인을 누르면 뒤로 간다", () => {
    setHappinessAfter( 150 );
    const { getByText, navigation } = renderCompleteCheckScreen( 143 );
    fireEvent.press( getByText( "확인" ) );

    expect( navigation.goBack ).toHaveBeenCalled();
  } );
} );
