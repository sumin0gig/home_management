import { useRoomStore } from "../../src/store/useRoomStore";
import type { RoomRow } from "../../src/store/useRoomStore";

const mockRoomUpdate = jest.fn();

jest.mock( "aws-amplify/data", () => ( {
  generateClient: () => ( {
    models: {
      Room: {
        update: ( ...args: unknown[] ) => mockRoomUpdate( ...args ),
      },
    },
  } ),
} ) );

const bedroom: RoomRow = {
  id: "r1",
  familyId: "f1",
  roomType: "BEDROOM",
  label: null,
  x: 0,
  y: 0,
  width: 2,
  height: 2,
} as RoomRow;

// 서버 응답 시점을 테스트가 직접 정할 수 있도록 resolve/reject를 밖으로 꺼낸 Promise
function deferred<T>() {
  let resolve!: ( value: T ) => void;
  let reject!: ( reason: unknown ) => void;
  const promise = new Promise<T>( ( res, rej ) => {
    resolve = res;
    reject = rej;
  } );
  return { promise, resolve, reject };
}

function currentBedroom() {
  return useRoomStore.getState().rooms.find( room => room.id === "r1" );
}

describe( "useRoomStore.updateRoomPosition", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    useRoomStore.getState().reset();
    useRoomStore.setState( { status: "loaded", rooms: [bedroom] } );
  } );

  test( "서버 응답을 기다리기 전에 store의 위치부터 바뀐다", async () => {
    const response = deferred<{ data: RoomRow; errors: undefined }>();
    mockRoomUpdate.mockReturnValue( response.promise );

    const pending = useRoomStore.getState().updateRoomPosition( "r1", 3, 1 );

    expect( currentBedroom() ).toMatchObject( { x: 3, y: 1 } );
    expect( mockRoomUpdate ).toHaveBeenCalledWith( { id: "r1", x: 3, y: 1 } );

    response.resolve( { data: { ...bedroom, x: 3, y: 1 }, errors: undefined } );
    await pending;

    expect( currentBedroom() ).toMatchObject( { x: 3, y: 1 } );
    expect( useRoomStore.getState().error ).toBeNull();
  } );

  test( "저장에 실패하면 원래 위치로 되돌리고 에러를 남긴다", async () => {
    mockRoomUpdate.mockRejectedValue( new Error( "network" ) );

    await expect(
      useRoomStore.getState().updateRoomPosition( "r1", 3, 1 ),
    ).resolves.toBe( false );

    expect( currentBedroom() ).toMatchObject( { x: 0, y: 0 } );
    expect( useRoomStore.getState().error ).toBe( "network" );
  } );

  test( "같은 방을 연달아 옮기면 먼저 보낸 요청의 응답이 나중 위치를 덮어쓰지 않는다", async () => {
    const first = deferred<{ data: RoomRow; errors: undefined }>();
    const second = deferred<{ data: RoomRow; errors: undefined }>();
    mockRoomUpdate
    .mockReturnValueOnce( first.promise )
    .mockReturnValueOnce( second.promise );

    const firstMove = useRoomStore.getState().updateRoomPosition( "r1", 3, 1 );
    const secondMove = useRoomStore.getState().updateRoomPosition( "r1", 5, 4 );

    first.resolve( { data: { ...bedroom, x: 3, y: 1 }, errors: undefined } );
    await firstMove;
    expect( currentBedroom() ).toMatchObject( { x: 5, y: 4 } );

    second.resolve( { data: { ...bedroom, x: 5, y: 4 }, errors: undefined } );
    await secondMove;
    expect( currentBedroom() ).toMatchObject( { x: 5, y: 4 } );
  } );

  test( "먼저 보낸 요청이 실패해도 나중에 옮긴 위치는 되돌리지 않는다", async () => {
    const first = deferred<{ data: RoomRow; errors: undefined }>();
    const second = deferred<{ data: RoomRow; errors: undefined }>();
    mockRoomUpdate
    .mockReturnValueOnce( first.promise )
    .mockReturnValueOnce( second.promise );

    const firstMove = useRoomStore.getState().updateRoomPosition( "r1", 3, 1 );
    const secondMove = useRoomStore.getState().updateRoomPosition( "r1", 5, 4 );

    first.reject( new Error( "network" ) );
    await expect( firstMove ).resolves.toBe( false );
    expect( currentBedroom() ).toMatchObject( { x: 5, y: 4 } );

    second.resolve( { data: { ...bedroom, x: 5, y: 4 }, errors: undefined } );
    await secondMove;
    expect( currentBedroom() ).toMatchObject( { x: 5, y: 4 } );
  } );
} );
