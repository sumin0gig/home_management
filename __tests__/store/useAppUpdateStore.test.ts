import { AppState, type AppStateStatus } from "react-native";
import { useAppUpdateStore } from "../../src/store/useAppUpdateStore";
import { checkStoreUpdateAvailable } from "../../actions";

jest.mock( "../../actions", () => ( {
  ...jest.requireActual( "../../actions" ),
  checkStoreUpdateAvailable: jest.fn(),
} ) );

const mockedCheckStoreUpdateAvailable = checkStoreUpdateAvailable as jest.Mock;

describe( "useAppUpdateStore.checkForUpdate", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    useAppUpdateStore.setState( { status: "checking" } );
  } );

  test( "스토어에 새 버전이 있으면 updateRequired가 된다", async () => {
    mockedCheckStoreUpdateAvailable.mockResolvedValueOnce( true );
    await useAppUpdateStore.getState().checkForUpdate();
    expect( useAppUpdateStore.getState().status ).toBe( "updateRequired" );
  } );

  test( "새 버전이 없으면 upToDate가 된다", async () => {
    mockedCheckStoreUpdateAvailable.mockResolvedValueOnce( false );
    await useAppUpdateStore.getState().checkForUpdate();
    expect( useAppUpdateStore.getState().status ).toBe( "upToDate" );
  } );

  test( "첫 확인이 실패하면 앱을 막지 않고 upToDate가 된다", async () => {
    mockedCheckStoreUpdateAvailable.mockRejectedValueOnce( new Error( "offline" ) );
    await expect(
      useAppUpdateStore.getState().checkForUpdate(),
    ).resolves.toBeUndefined();
    expect( useAppUpdateStore.getState().status ).toBe( "upToDate" );
  } );

  test( "이미 updateRequired면 다시 확인이 실패해도 풀리지 않는다", async () => {
    useAppUpdateStore.setState( { status: "updateRequired" } );
    mockedCheckStoreUpdateAvailable.mockRejectedValueOnce( new Error( "offline" ) );
    await useAppUpdateStore.getState().checkForUpdate();
    expect( useAppUpdateStore.getState().status ).toBe( "updateRequired" );
  } );
} );

describe( "useAppUpdateStore.subscribeToAppState", () => {
  beforeEach( () => {
    jest.clearAllMocks();
  } );

  test( "포그라운드로 돌아올 때만 다시 확인하고, 구독 해제할 수 있다", () => {
    const remove = jest.fn();
    let onChange: ( state: AppStateStatus ) => void = () => {};
    const addEventListener = jest
    .spyOn( AppState, "addEventListener" )
    .mockImplementation( ( _type, listener ) => {
      onChange = listener;
      return { remove };
    } );
    mockedCheckStoreUpdateAvailable.mockResolvedValue( false );

    const unsubscribe = useAppUpdateStore.getState().subscribeToAppState();
    onChange( "background" );
    expect( mockedCheckStoreUpdateAvailable ).not.toHaveBeenCalled();
    onChange( "active" );
    expect( mockedCheckStoreUpdateAvailable ).toHaveBeenCalledTimes( 1 );

    unsubscribe();
    expect( remove ).toHaveBeenCalledTimes( 1 );
    addEventListener.mockRestore();
  } );
} );
