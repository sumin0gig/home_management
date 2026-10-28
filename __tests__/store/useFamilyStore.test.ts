import {
  ALREADY_IN_FAMILY_MESSAGE,
  pickPrimaryMembership,
  useFamilyStore,
  type FamilyMemberRow,
} from "../../src/store/useFamilyStore";
import {
  fetchDisplayName,
  getCurrentAuthUser,
  listRoomsForFamily,
} from "../../actions";

const mockFamilyMemberList = jest.fn();
const mockFamilyMemberCreate = jest.fn();
const mockFamilyMemberUpdate = jest.fn();
const mockFamilyGet = jest.fn();
const mockListFamilyByInviteCode = jest.fn();

jest.mock( "aws-amplify/data", () => ( {
  generateClient: () => ( {
    models: {
      FamilyMember: {
        list: (...args: unknown[]) => mockFamilyMemberList( ...args ),
        create: (...args: unknown[]) => mockFamilyMemberCreate( ...args ),
        update: (...args: unknown[]) => mockFamilyMemberUpdate( ...args ),
      },
      Family: {
        get: (...args: unknown[]) => mockFamilyGet( ...args ),
        listFamilyByInviteCode: (...args: unknown[]) =>
          mockListFamilyByInviteCode( ...args ),
      },
    },
  } ),
} ) );

jest.mock( "../../actions", () => ( {
  ...jest.requireActual( "../../actions" ),
  getCurrentAuthUser: jest.fn(),
  fetchDisplayName: jest.fn(),
  listRoomsForFamily: jest.fn(),
} ) );

function member(overrides: Partial<FamilyMemberRow>): FamilyMemberRow {
  return {
    id: "m1",
    familyId: "f1",
    userId: "u1",
    familyOwnerId: ["u1"],
    displayName: "나",
    role: "MEMBER",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as FamilyMemberRow;
}

// FamilyMember.list는 filter에 따라 내 기록(userId) 또는 가족 구성원(familyId)을 돌려준다.
function mockMemberships(mine: FamilyMemberRow[], familyMembers = mine) {
  mockFamilyMemberList.mockImplementation(
    (args: { filter: { userId?: unknown; familyId?: unknown } }) =>
      Promise.resolve( {
        data: args.filter.userId ? mine : familyMembers,
        nextToken: null,
        errors: undefined,
      } ),
  );
}

describe( "useFamilyStore", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    useFamilyStore.getState().reset();
    ( getCurrentAuthUser as jest.Mock ).mockResolvedValue( { userId: "u1" } );
    ( fetchDisplayName as jest.Mock ).mockResolvedValue( "나" );
    mockFamilyMemberCreate.mockResolvedValue( { data: {}, errors: undefined } );
  } );

  describe( "lookupFamilyByCode", () => {
    test( "코드를 대문자·영문숫자로 바꿔 찾고, 관리자 이름·구성원 수·방 수를 돌려준다 (참여는 하지 않는다)", async () => {
      mockListFamilyByInviteCode.mockResolvedValue( {
        data: [{ id: "f2", name: "민수네", ownerId: "u2" }],
        errors: undefined,
      } );
      mockMemberships( [], [
        member( { id: "o", userId: "u2", displayName: "민수", role: "OWNER", familyId: "f2" } ),
        member( { id: "x", userId: "u3", displayName: "지수", familyId: "f2" } ),
      ] );
      ( listRoomsForFamily as jest.Mock ).mockResolvedValue( [{ id: "r1" }, { id: "r2" }] );

      const result = await useFamilyStore.getState().lookupFamilyByCode( " k7q2-mx " );

      expect( mockListFamilyByInviteCode ).toHaveBeenCalledWith( { inviteCode: "K7Q2MX" } );
      expect( result ).toEqual( {
        family: { id: "f2", name: "민수네", ownerId: "u2" },
        ownerName: "민수",
        memberCount: 2,
        roomCount: 2,
      } );
      expect( mockFamilyMemberCreate ).not.toHaveBeenCalled();
    } );

    test( "없는 코드면 null", async () => {
      mockListFamilyByInviteCode.mockResolvedValue( { data: [], errors: undefined } );
      await expect( useFamilyStore.getState().lookupFamilyByCode( "AAAAAA" ) ).resolves.toBeNull();
      expect( useFamilyStore.getState().error ).toBeNull();
    } );
  } );

  describe( "joinFamily", () => {
    test( "이미 가족이 있으면 구성원을 만들지 않고 false와 안내 문구를 남긴다", async () => {
      mockMemberships( [member( {} )] );
      mockFamilyGet.mockResolvedValue( { data: { id: "f2", ownerId: "u2" }, errors: undefined } );

      await expect(
        useFamilyStore.getState().joinFamily( "f2" ),
      ).resolves.toBe( false );

      expect( mockFamilyMemberCreate ).not.toHaveBeenCalled();
      expect( useFamilyStore.getState().error ).toBe( ALREADY_IN_FAMILY_MESSAGE );
    } );

    test( "가족이 없으면 그 가족에 구성원으로 참여한다", async () => {
      mockMemberships( [] );
      mockFamilyGet.mockResolvedValue( { data: { id: "f2", ownerId: "u2" }, errors: undefined } );

      await expect(
        useFamilyStore.getState().joinFamily( "f2" ),
      ).resolves.toBe( true );

      expect( mockFamilyGet ).toHaveBeenCalledWith( { id: "f2" } );
      expect( mockFamilyMemberCreate ).toHaveBeenCalledWith( {
        familyId: "f2",
        userId: "u1",
        familyOwnerId: ["u2"],
        displayName: "나",
        role: "MEMBER",
      } );
    } );
  } );

  describe( "updateMyDisplayName", () => {
    test( "내 구성원 기록의 이름을 바꾸고 membership·members를 갱신한다", async () => {
      const mine = member( { id: "me", displayName: "수민" } );
      const other = member( { id: "o", userId: "u2", displayName: "민수" } );
      useFamilyStore.setState( { membership: mine, members: [mine, other] } );
      mockFamilyMemberUpdate.mockResolvedValue( {
        data: { ...mine, displayName: "수민2" },
        errors: undefined,
      } );

      await expect( useFamilyStore.getState().updateMyDisplayName( "수민2" ) ).resolves.toBe( true );

      expect( mockFamilyMemberUpdate ).toHaveBeenCalledWith( { id: "me", displayName: "수민2" } );
      expect( useFamilyStore.getState().membership?.displayName ).toBe( "수민2" );
      expect( useFamilyStore.getState().members.map( m => m.displayName ) ).toEqual( ["수민2", "민수"] );
    } );
  } );

  describe( "fetchMyFamily", () => {
    test( "구성원 기록이 두 개면 createdAt이 이른 쪽 가족을 고른다", async () => {
      const later = member( {
        id: "m-later",
        familyId: "f-later",
        createdAt: "2026-05-01T00:00:00.000Z",
      } );
      const earlier = member( {
        id: "m-earlier",
        familyId: "f-earlier",
        createdAt: "2026-02-01T00:00:00.000Z",
      } );
      mockMemberships( [later, earlier] );
      mockFamilyGet.mockImplementation( ({ id }: { id: string }) =>
        Promise.resolve( { data: { id, name: id }, errors: undefined } ),
      );

      await useFamilyStore.getState().fetchMyFamily();

      expect( mockFamilyGet ).toHaveBeenCalledWith( { id: "f-earlier" } );
      expect( useFamilyStore.getState().membership?.id ).toBe( "m-earlier" );
      expect( useFamilyStore.getState().family?.id ).toBe( "f-earlier" );
    } );
  } );

  describe( "pickPrimaryMembership", () => {
    test( "기록이 없으면 null", () => {
      expect( pickPrimaryMembership( [] ) ).toBeNull();
    } );

    test( "순서와 상관없이 가장 먼저 만든 기록", () => {
      const a = member( { id: "a", createdAt: "2026-03-01T00:00:00.000Z" } );
      const b = member( { id: "b", createdAt: "2026-01-01T00:00:00.000Z" } );
      expect( pickPrimaryMembership( [a, b] )?.id ).toBe( "b" );
      expect( pickPrimaryMembership( [b, a] )?.id ).toBe( "b" );
    } );
  } );
} );
