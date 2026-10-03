import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ForceUpdateScreen from "../../../src/components/ForceUpdate/ForceUpdateScreen";
import { openPlayStore, startImmediateUpdate } from "../../../actions";

jest.mock( "../../../actions", () => ( {
  ...jest.requireActual( "../../../actions" ),
  startImmediateUpdate: jest.fn(),
  openPlayStore: jest.fn(),
} ) );

const mockedStartImmediateUpdate = startImmediateUpdate as jest.Mock;
const mockedOpenPlayStore = openPlayStore as jest.Mock;

describe( "ForceUpdateScreen", () => {
  beforeEach( () => {
    jest.clearAllMocks();
  } );

  test( "업데이트 안내와 버튼을 표시하고, 닫기 버튼은 없다", () => {
    const { getByText, queryByText } = render( <ForceUpdateScreen /> );
    expect( getByText( "새 버전이 나왔어요" ) ).toBeTruthy();
    expect( getByText( "업데이트" ) ).toBeTruthy();
    expect( queryByText( "나중에" ) ).toBeNull();
  } );

  test( "버튼을 탭하면 Play 인앱 업데이트를 시작한다", async () => {
    mockedStartImmediateUpdate.mockResolvedValueOnce( undefined );
    const { getByText } = render( <ForceUpdateScreen /> );
    fireEvent.press( getByText( "업데이트" ) );
    await waitFor( () =>
      expect( mockedStartImmediateUpdate ).toHaveBeenCalledTimes( 1 ),
    );
    expect( mockedOpenPlayStore ).not.toHaveBeenCalled();
  } );

  test( "인앱 업데이트를 띄울 수 없으면 Play 스토어 페이지를 연다", async () => {
    mockedStartImmediateUpdate.mockRejectedValueOnce( new Error( "unavailable" ) );
    mockedOpenPlayStore.mockResolvedValueOnce( undefined );
    const { getByText, queryByText } = render( <ForceUpdateScreen /> );
    fireEvent.press( getByText( "업데이트" ) );
    await waitFor( () => expect( mockedOpenPlayStore ).toHaveBeenCalledTimes( 1 ) );
    expect( queryByText( "Play 스토어를 열 수 없습니다." ) ).toBeNull();
  } );

  test( "Play 스토어도 열 수 없으면 에러 메시지를 표시한다", async () => {
    mockedStartImmediateUpdate.mockRejectedValueOnce( new Error( "unavailable" ) );
    mockedOpenPlayStore.mockRejectedValueOnce( new Error( "no store" ) );
    const { getByText } = render( <ForceUpdateScreen /> );
    fireEvent.press( getByText( "업데이트" ) );
    await waitFor( () =>
      expect( getByText( "Play 스토어를 열 수 없습니다." ) ).toBeTruthy(),
    );
  } );
} );
