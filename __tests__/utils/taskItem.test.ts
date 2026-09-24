import { splitTaskItemContent } from "../../src/utils/taskItem";

describe( "splitTaskItemContent", () => {
  test( "한 줄이면 제목만 있고 설명은 없다", () => {
    expect( splitTaskItemContent( "곰팡이 제거제 뿌리기" ) ).toEqual( {
      title: "곰팡이 제거제 뿌리기",
      description: null,
    } );
  } );

  test( "첫 줄은 제목, 나머지 줄은 설명이 된다", () => {
    expect(
      splitTaskItemContent( "솔로 문지르기\n약 5분 정도 기다린 후,\n솔로 문질러 닦아주세요." ),
    ).toEqual( {
      title: "솔로 문지르기",
      description: "약 5분 정도 기다린 후,\n솔로 문질러 닦아주세요.",
    } );
  } );

  test( "CRLF 줄바꿈도 처리한다", () => {
    expect( splitTaskItemContent( "제목\r\n설명" ) ).toEqual( {
      title: "제목",
      description: "설명",
    } );
  } );

  test( "앞뒤 공백과 빈 줄은 무시한다", () => {
    expect( splitTaskItemContent( "  제목  \n\n  설명  \n\n" ) ).toEqual( {
      title: "제목",
      description: "설명",
    } );
  } );

  test( "제목 뒤에 빈 줄만 있으면 설명은 없다", () => {
    expect( splitTaskItemContent( "제목\n\n\n" ) ).toEqual( {
      title: "제목",
      description: null,
    } );
  } );
} );
