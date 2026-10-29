import {
  NOT_OWNER_MESSAGE,
  NOT_SAME_FAMILY_MESSAGE,
  transferFamilyOwnership,
  type FamilyLike,
  type MemberLike,
  type TransferDeps,
} from "../../amplify/functions/transferFamilyOwnership/logic";

// 메모리 안의 가족 데이터로 deps를 흉내 내고, 바뀐 순서를 기록한다.
function fakeData( family: FamilyLike, members: MemberLike[] ) {
  const state = {
    family: { ...family },
    members: members.map( m => ( { ...m, familyOwnerId: [...m.familyOwnerId] } ) ),
  };
  const calls: string[] = [];
  const deps: TransferDeps = {
    getFamily: async id => ( id === state.family.id ? { ...state.family } : null ),
    listMembers: async familyId =>
      state.members.filter( m => m.familyId === familyId ).map( m => ( { ...m } ) ),
    updateMember: jest.fn( async input => {
      const member = state.members.find( m => m.id === input.id )!;
      if (input.role) {
        member.role = input.role;
        calls.push( `role:${input.id}=${input.role}` );
      }
      if (input.familyOwnerId) {
        member.familyOwnerId = input.familyOwnerId;
        calls.push( `familyOwnerId:${input.id}` );
      }
    } ),
    updateFamily: jest.fn( async input => {
      state.family = { ...state.family, ownerId: input.ownerId, owner: input.owner };
      calls.push( "family" );
      return { ...state.family };
    } ),
  };
  return { deps, state, calls };
}

const family: FamilyLike = { id: "f1", ownerId: "sub-owner", owner: "sub-owner" };
const owner: MemberLike = { id: "m-owner", familyId: "f1", userId: "sub-owner", role: "OWNER", familyOwnerId: ["sub-owner"] };
const minsu: MemberLike = { id: "m-minsu", familyId: "f1", userId: "sub-minsu", role: "MEMBER", familyOwnerId: ["sub-owner"] };
const jisu: MemberLike = { id: "m-jisu", familyId: "f1", userId: "sub-jisu", role: "MEMBER", familyOwnerId: ["sub-owner"] };
const stranger: MemberLike = { id: "m-x", familyId: "f2", userId: "sub-x", role: "MEMBER", familyOwnerId: ["sub-y"] };

describe( "transferFamilyOwnership", () => {
  test( "관리자가 아니면 오류", async () => {
    const { deps } = fakeData( family, [owner, minsu, jisu] );
    await expect(
      transferFamilyOwnership( deps, { callerSub: "sub-minsu", familyId: "f1", newOwnerMemberId: "m-jisu" } ),
    ).rejects.toThrow( NOT_OWNER_MESSAGE );
    expect( deps.updateMember ).not.toHaveBeenCalled();
  } );

  test( "다른 가족 구성원이나 나 자신에게는 넘길 수 없다", async () => {
    const { deps } = fakeData( family, [owner, minsu, stranger] );
    await expect(
      transferFamilyOwnership( deps, { callerSub: "sub-owner", familyId: "f1", newOwnerMemberId: "m-x" } ),
    ).rejects.toThrow( NOT_SAME_FAMILY_MESSAGE );
    await expect(
      transferFamilyOwnership( deps, { callerSub: "sub-owner", familyId: "f1", newOwnerMemberId: "m-owner" } ),
    ).rejects.toThrow( NOT_SAME_FAMILY_MESSAGE );
    expect( deps.updateMember ).not.toHaveBeenCalled();
  } );

  test( "정상: 새 관리자 role → Family → 모든 구성원 familyOwnerId → 부른 사람 role 순서", async () => {
    const { deps, state, calls } = fakeData( family, [owner, minsu, jisu] );

    const result = await transferFamilyOwnership( deps, {
      callerSub: "sub-owner",
      familyId: "f1",
      newOwnerMemberId: "m-minsu",
    } );

    expect( calls ).toEqual( [
      "role:m-minsu=OWNER",
      "family",
      "familyOwnerId:m-owner",
      "familyOwnerId:m-minsu",
      "familyOwnerId:m-jisu",
      "role:m-owner=MEMBER",
    ] );
    expect( result ).toMatchObject( { ownerId: "sub-minsu", owner: "sub-minsu" } );
    expect( state.members.every( m => m.familyOwnerId[0] === "sub-minsu" ) ).toBe( true );
  } );

  test( "중간에 실패해도 다시 부르면 남은 단계만 해서 끝까지 맞춘다", async () => {
    const { deps, state, calls } = fakeData( family, [owner, minsu, jisu] );
    // ③의 두 번째 구성원에서 한 번 실패
    const realUpdate = deps.updateMember;
    let failed = false;
    deps.updateMember = jest.fn( async input => {
      if (!failed && input.id === "m-minsu" && input.familyOwnerId) {
        failed = true;
        throw new Error( "네트워크 오류" );
      }
      return realUpdate( input );
    } );

    await expect(
      transferFamilyOwnership( deps, { callerSub: "sub-owner", familyId: "f1", newOwnerMemberId: "m-minsu" } ),
    ).rejects.toThrow( "네트워크 오류" );
    calls.length = 0;

    await transferFamilyOwnership( deps, {
      callerSub: "sub-owner",
      familyId: "f1",
      newOwnerMemberId: "m-minsu",
    } );

    // 이미 된 ①②와 m-owner의 ③은 건너뛴다
    expect( calls ).toEqual( [
      "familyOwnerId:m-minsu",
      "familyOwnerId:m-jisu",
      "role:m-owner=MEMBER",
    ] );
    expect( state.family.ownerId ).toBe( "sub-minsu" );
    expect( state.members.find( m => m.id === "m-owner" )?.role ).toBe( "MEMBER" );
  } );

  test( "이미 끝난 뒤 다시 불러도 오류 없이 그대로 돌려준다", async () => {
    const { deps, calls } = fakeData( family, [owner, minsu, jisu] );
    const args = { callerSub: "sub-owner", familyId: "f1", newOwnerMemberId: "m-minsu" };
    await transferFamilyOwnership( deps, args );
    calls.length = 0;

    await expect( transferFamilyOwnership( deps, args ) ).resolves.toMatchObject( { ownerId: "sub-minsu" } );
    expect( calls ).toEqual( [] );
  } );

  test( "소유자 필드가 sub::username 형식이면 잘못 쓰지 않도록 멈춘다", async () => {
    const { deps } = fakeData( { ...family, owner: "sub-owner::google_123" }, [owner, minsu] );
    await expect(
      transferFamilyOwnership( deps, { callerSub: "sub-owner", familyId: "f1", newOwnerMemberId: "m-minsu" } ),
    ).rejects.toThrow( /소유자 필드 형식/ );
    expect( deps.updateFamily ).not.toHaveBeenCalled();
  } );
} );
