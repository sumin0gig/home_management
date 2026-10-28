import {
  ALREADY_IN_FAMILY_MESSAGE,
  INVALID_CODE_MESSAGE,
  joinFamilyByCode,
  type JoinDeps,
} from "../../amplify/functions/joinFamilyByCode/logic";

function deps( overrides: Partial<JoinDeps> = {} ): JoinDeps {
  return {
    findFamilyByCode: jest.fn( async code => ( code === "K7Q2MX" ? { id: "f1", ownerId: "sub-owner" } : null ) ),
    countMembershipsOf: jest.fn( async () => 0 ),
    getDisplayName: jest.fn( async () => "수민" ),
    createMember: jest.fn( async () => ( { id: "m-new" } ) ),
    ...overrides,
  };
}

describe( "joinFamilyByCode", () => {
  test( "코드를 정리해서 찾고, 서버가 정한 role·familyOwnerId·owner로 구성원을 만든다", async () => {
    const d = deps();
    await expect(
      joinFamilyByCode( d, { callerSub: "sub-me", inviteCode: " k7q2-mx " } ),
    ).resolves.toEqual( { familyId: "f1", memberId: "m-new" } );
    expect( d.createMember ).toHaveBeenCalledWith( {
      familyId: "f1",
      userId: "sub-me",
      familyOwnerId: ["sub-owner"],
      displayName: "수민",
      role: "MEMBER",
      owner: "sub-me",
    } );
  } );

  test( "없는 코드면 오류", async () => {
    await expect(
      joinFamilyByCode( deps(), { callerSub: "sub-me", inviteCode: "AAAAAA" } ),
    ).rejects.toThrow( INVALID_CODE_MESSAGE );
  } );

  test( "이미 가족이 있으면 만들지 않는다", async () => {
    const d = deps( { countMembershipsOf: jest.fn( async () => 1 ) } );
    await expect(
      joinFamilyByCode( d, { callerSub: "sub-me", inviteCode: "K7Q2MX" } ),
    ).rejects.toThrow( ALREADY_IN_FAMILY_MESSAGE );
    expect( d.createMember ).not.toHaveBeenCalled();
  } );
} );
