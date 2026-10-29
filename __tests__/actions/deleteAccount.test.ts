import { deleteUser } from "aws-amplify/auth";
import { deleteAccount, throwIfDeleteErrors } from "../../actions";

// 메모리 안의 테이블. delete는 없는 기록이면 DynamoDB처럼 조건 검사 실패 오류를 돌려준다.
type Row = Record<string, unknown> & { id: string };
const mockDb: Record<string, Row[]> = {};
const mockFailOnce: { table: string | null } = { table: null };

function mockTable( name: string ) {
  const rows = () => ( mockDb[name] = mockDb[name] ?? [] );
  const page = ( data: Row[] ) => Promise.resolve( { data, nextToken: null, errors: undefined } );
  return {
    list: ( { filter }: { filter: Record<string, { eq: string }> } ) =>
      page(
        rows().filter( row =>
          Object.entries( filter ).every( ( [key, cond] ) => row[key] === cond.eq ),
        ),
      ),
    listBy: ( key: string ) => ( args: Record<string, string> ) =>
      page( rows().filter( row => row[key] === args[key] ) ),
    get: ( { id }: { id: string } ) =>
      Promise.resolve( { data: rows().find( r => r.id === id ) ?? null, errors: undefined } ),
    delete: ( { id }: { id: string } ) => {
      if (mockFailOnce.table === name) {
        mockFailOnce.table = null;
        return Promise.resolve( { data: null, errors: [{ message: "네트워크 오류" }] } );
      }
      const index = rows().findIndex( r => r.id === id );
      if (index < 0) {
        return Promise.resolve( {
          data: null,
          errors: [{ errorType: "DynamoDB:ConditionalCheckFailedException", message: "The conditional request failed" }],
        } );
      }
      rows().splice( index, 1 );
      return Promise.resolve( { data: { id }, errors: undefined } );
    },
  };
}

jest.mock( "aws-amplify/data", () => {
  const t = ( name: string ) => mockTable( name );
  return {
    generateClient: () => ( {
      models: {
        FamilyMember: { list: t( "FamilyMember" ).list, delete: t( "FamilyMember" ).delete },
        Family: { delete: t( "Family" ).delete, get: t( "Family" ).get },
        Room: { listRoomByFamilyId: t( "Room" ).listBy( "familyId" ), delete: t( "Room" ).delete },
        Task: { listTaskByRoomId: t( "Task" ).listBy( "roomId" ), delete: t( "Task" ).delete },
        TaskLog: { listTaskLogByTaskId: t( "TaskLog" ).listBy( "taskId" ), delete: t( "TaskLog" ).delete },
        TaskItem: { listTaskItemByTaskId: t( "TaskItem" ).listBy( "taskId" ), delete: t( "TaskItem" ).delete },
        Mascot: { listMascotByUserId: t( "Mascot" ).listBy( "userId" ), delete: t( "Mascot" ).delete },
        DeviceToken: {
          listDeviceTokenByUserId: t( "DeviceToken" ).listBy( "userId" ),
          delete: t( "DeviceToken" ).delete,
        },
        User: { get: t( "User" ).get, delete: t( "User" ).delete },
      },
    } ),
  };
} );

jest.mock( "aws-amplify/auth", () => ( {
  getCurrentUser: jest.fn( () => Promise.resolve( { userId: "u1" } ) ),
  deleteUser: jest.fn( () => Promise.resolve() ),
  signInWithRedirect: jest.fn(),
  signOut: jest.fn(),
  fetchUserAttributes: jest.fn(),
} ) );

function seedAloneOwner() {
  Object.assign( mockDb, {
    FamilyMember: [{ id: "m1", userId: "u1", familyId: "f1", role: "OWNER" }],
    Family: [{ id: "f1" }],
    Room: [{ id: "r1", familyId: "f1" }],
    Task: [{ id: "t1", roomId: "r1" }],
    TaskLog: [{ id: "l1", taskId: "t1" }],
    TaskItem: [{ id: "i1", taskId: "t1" }],
    Mascot: [{ id: "ms1", userId: "u1" }],
    DeviceToken: [{ id: "d1", userId: "u1" }],
    User: [{ id: "u1" }],
  } );
}

function remaining() {
  return Object.fromEntries( Object.entries( mockDb ).map( ( [k, v] ) => [k, v.length] ) );
}

describe( "deleteAccount", () => {
  beforeEach( () => {
    Object.keys( mockDb ).forEach( key => delete mockDb[key] );
    mockFailOnce.table = null;
    jest.clearAllMocks();
  } );

  test( "혼자인 관리자의 데이터를 모두 지우고, 계정을 지우기 직전에 알려준다", async () => {
    seedAloneOwner();
    const onBeforeDeleteUser = jest.fn();

    await deleteAccount( { onBeforeDeleteUser } );

    expect( Object.values( remaining() ).every( n => n === 0 ) ).toBe( true );
    expect( onBeforeDeleteUser ).toHaveBeenCalledTimes( 1 );
    expect( deleteUser ).toHaveBeenCalledTimes( 1 );
  } );

  test( "두 번 연속 불러도 두 번째가 오류 없이 끝난다", async () => {
    seedAloneOwner();
    await deleteAccount();
    await expect( deleteAccount() ).resolves.toBeUndefined();
  } );

  test( "가족 삭제에서 실패해도 다시 부르면 남은 것만 지우고 끝난다", async () => {
    seedAloneOwner();
    mockFailOnce.table = "Family";

    await expect( deleteAccount() ).rejects.toThrow( "네트워크 오류" );
    // 가족을 지우기 전에 실패했으므로 내 구성원 기록은 남아 있어 다시 찾을 수 있다
    expect( remaining().FamilyMember ).toBe( 1 );
    expect( deleteUser ).not.toHaveBeenCalled();

    await expect( deleteAccount() ).resolves.toBeUndefined();
    expect( Object.values( remaining() ).every( n => n === 0 ) ).toBe( true );
  } );

  test( "다른 구성원이 있는 가족의 관리자는 아무것도 지우지 않고 막는다", async () => {
    seedAloneOwner();
    mockDb.FamilyMember.push( { id: "m2", userId: "u2", familyId: "f1", role: "MEMBER" } );

    await expect( deleteAccount() ).rejects.toThrow( /관리자는 탈퇴할 수 없어요/ );
    expect( remaining().Room ).toBe( 1 );
  } );
} );

describe( "throwIfDeleteErrors", () => {
  test( "이미 지워진 기록(조건 검사 실패)은 무시하고, 다른 오류는 던진다", () => {
    expect( () =>
      throwIfDeleteErrors( [{ errorType: "DynamoDB:ConditionalCheckFailedException" }], "x" ),
    ).not.toThrow();
    expect( () => throwIfDeleteErrors( [{ message: "권한 없음" }], "x" ) ).toThrow( "권한 없음" );
  } );
} );
