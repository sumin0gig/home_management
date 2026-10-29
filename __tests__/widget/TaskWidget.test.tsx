import React from "react";
import { getStateFromPath } from "@react-navigation/native";
import { TaskWidget } from "../../src/widget/TaskWidget";
import {
  buildWidgetSnapshot,
  type WidgetSnapshot,
} from "../../src/widget/widgetSnapshot";
import { linking } from "../../src/navigation/linking";

// 위젯 컴포넌트(FlexWidget 등)는 RN 화면에 그려지지 않으므로 JSX 트리를 펼쳐서 검사한다.
interface Node {
  name: string;
  props: Record<string, unknown>;
  children: Node[];
}

function expand( element: unknown ): Node[] {
  if (element == null || typeof element === "boolean") {
    return [];
  }
  if (Array.isArray( element )) {
    return element.flatMap( expand );
  }
  const el = element as React.ReactElement<Record<string, unknown>> & {
    type: ( ( props: object ) => unknown ) & { __name__?: string };
  };
  if (el.type.__name__) {
    return [{
      name: el.type.__name__,
      props: el.props,
      children: expand( el.props.children ),
    }];
  }
  // 위젯 안에서 쓰는 작은 함수 컴포넌트(TaskCell 등)는 훅이 없어 바로 부를 수 있다.
  return expand( el.type( el.props ) );
}

function walk( nodes: Node[] ): Node[] {
  return nodes.flatMap( node => [node, ...walk( node.children )] );
}

function texts( nodes: Node[] ): string[] {
  return walk( nodes )
  .filter( n => n.name === "TextWidget" )
  .map( n => n.props.text as string );
}

function uris( nodes: Node[] ): string[] {
  return walk( nodes )
  .map( n => ( n.props.clickActionData as { uri?: string } | undefined )?.uri )
  .filter( ( uri ): uri is string => !!uri );
}

function renderWidget( snapshot: WidgetSnapshot, today: string, size = { width: 320, height: 180 } ) {
  return expand( <TaskWidget snapshot={ snapshot } today={ today } { ...size } /> );
}

function snapshotOf(
  tasks: Array<[id: string, title: string, nextDueDate: string]>,
  options: { showMascot?: boolean } = {},
): WidgetSnapshot {
  return buildWidgetSnapshot( {
    tasks: tasks.map( ( [id, title, nextDueDate] ) => ( { id, title, roomId: "r1", nextDueDate } ) ),
    rooms: [{ id: "r1", color: "#A9DDF2" }],
    mascot: { fillColor: "#FBD9A0", earStyle: "POINTY" },
    showMascot: options.showMascot ?? true,
    today: "2026-10-28",
  } );
}

describe( "TaskWidget", () => {
  test( "같은 스냅샷이라도 다음 날에는 기한이 된 일이 새로 나타난다", () => {
    const snapshot = snapshotOf( [
      ["a", "설거지", "2026-10-27"],
      ["b", "분리수거", "2026-10-29"],
    ] );

    const today = texts( renderWidget( snapshot, "2026-10-28" ) );
    expect( today ).toContain( "설거지" );
    expect( today ).not.toContain( "분리수거" );

    const tomorrow = texts( renderWidget( snapshot, "2026-10-29" ) );
    expect( tomorrow ).toEqual( expect.arrayContaining( ["설거지", "분리수거"] ) );
  } );

  test( "상태 글자('지남', 'D-', '오늘'만 있는 라벨)와 방 이름을 그리지 않는다", () => {
    const snapshot = snapshotOf( [
      ["a", "설거지", "2026-10-20"],
      ["b", "빨래", "2026-10-28"],
    ] );
    const all = texts( renderWidget( snapshot, "2026-10-28" ) );

    all.forEach( text => {
      expect( text ).not.toMatch( /지남|D-|내일/ );
      expect( text ).not.toBe( "오늘" );
      expect( text ).not.toMatch( /화장실|부엌|거실|침실|현관/ );
    } );
  } );

  test( "할 일이 7개 이상이면(4×2) 마지막 칸이 '+N개'", () => {
    const tasks = Array.from( { length: 8 } ).map(
      ( _, i ) => [`t${i}`, `일${i}`, "2026-10-28"] as [string, string, string],
    );
    const nodes = renderWidget( snapshotOf( tasks ), "2026-10-28" );
    const all = texts( nodes );

    expect( all ).toContain( "일0" );
    expect( all ).toContain( "일4" );
    expect( all ).not.toContain( "일5" );
    expect( all ).toContain( "+3개" );
    // 머리줄 개수 알약은 전체 개수
    expect( all ).toContain( "8" );
  } );

  test( "6개면 6칸에 모두 나오고 '+N개'는 없다", () => {
    const tasks = Array.from( { length: 6 } ).map(
      ( _, i ) => [`t${i}`, `일${i}`, "2026-10-28"] as [string, string, string],
    );
    const all = texts( renderWidget( snapshotOf( tasks ), "2026-10-28" ) );
    expect( all ).toContain( "일5" );
    expect( all.some( t => /^\+\d+개$/.test( t ) ) ).toBe( false );
  } );

  test( "0개면 '오늘 할 일 없어요'", () => {
    const all = texts( renderWidget( snapshotOf( [["a", "분리수거", "2026-11-01"]] ), "2026-10-28" ) );
    expect( all ).toEqual( ["오늘 할 일 없어요", "우리집이 깨끗해요"] );
  } );

  test( "칸의 클릭 링크는 homemanagement://task/{id}, 바깥은 홈", () => {
    const nodes = renderWidget( snapshotOf( [["abc-1", "설거지", "2026-10-28"]] ), "2026-10-28" );
    expect( uris( nodes ) ).toEqual( ["homemanagement://tasks", "homemanagement://task/abc-1"] );
  } );

  test( "showMascot이 false면 마스코트 SVG가 없다", () => {
    const shown = walk( renderWidget( snapshotOf( [["a", "설거지", "2026-10-28"]] ), "2026-10-28" ) );
    expect( shown.some( n => n.name === "SvgWidget" ) ).toBe( true );

    const hiddenFull = walk(
      renderWidget( snapshotOf( [["a", "설거지", "2026-10-28"]], { showMascot: false } ), "2026-10-28" ),
    );
    const hiddenEmpty = walk( renderWidget( snapshotOf( [], { showMascot: false } ), "2026-10-28" ) );
    expect( hiddenFull.some( n => n.name === "SvgWidget" ) ).toBe( false );
    expect( hiddenEmpty.some( n => n.name === "SvgWidget" ) ).toBe( false );
  } );

  test( "너비가 200dp보다 좁으면 한 줄에 한 칸, 넓으면 두 칸", () => {
    const tasks = [["a", "가", "2026-10-28"], ["b", "나", "2026-10-28"]] as Array<[string, string, string]>;
    const cellsPerRow = ( width: number ) =>
      walk( renderWidget( snapshotOf( tasks ), "2026-10-28", { width, height: 180 } ) )
      .filter( n => ( n.props.style as { flexGap?: number } | undefined )?.flexGap === 6 )
      .map( row => row.children.length );

    expect( cellsPerRow( 180 ) ).toEqual( [1, 1] );
    expect( cellsPerRow( 320 ) ).toEqual( [2] );
  } );
} );

describe( "buildWidgetSnapshot", () => {
  test( "앞으로 7일 안의 일을 기한 순으로 최대 12개, 방 색과 함께 저장한다", () => {
    const tasks = Array.from( { length: 15 } ).map(
      ( _, i ) => [`t${i}`, `일${i}`, "2026-10-28"] as [string, string, string],
    );
    tasks.push( ["far", "먼 일", "2026-11-10"] );
    const snapshot = snapshotOf( tasks );
    expect( snapshot.tasks ).toHaveLength( 12 );
    expect( snapshot.tasks.map( t => t.id ) ).not.toContain( "far" );
    expect( snapshot.tasks[0].roomColor ).toBe( "#A9DDF2" );
  } );
} );

describe( "위젯 링크", () => {
  test( "homemanagement://task/{id}는 홈 위에 TaskSheet를 연다", () => {
    const state = getStateFromPath( "task/abc-1", linking.config );
    expect( state?.routes.map( r => r.name ) ).toEqual( ["HomeMain", "TaskSheet"] );
    expect( state?.routes[1].params ).toEqual( { taskId: "abc-1" } );
  } );
} );
