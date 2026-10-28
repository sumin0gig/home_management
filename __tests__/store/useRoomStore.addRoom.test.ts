import { useRoomStore } from "../../src/store/useRoomStore";
import {
  listTaskTemplateItemsForTemplate,
  listTaskTemplatesForRoomType,
} from "../../actions";

const mockRoomCreate = jest.fn();
const mockTaskCreate = jest.fn();

jest.mock( "aws-amplify/data", () => ( {
  generateClient: () => ( {
    models: {
      Room: { create: ( ...args: unknown[] ) => mockRoomCreate( ...args ) },
      Task: { create: ( ...args: unknown[] ) => mockTaskCreate( ...args ) },
      TaskItem: { create: jest.fn() },
    },
  } ),
} ) );

jest.mock( "../../actions", () => ( {
  ...jest.requireActual( "../../actions" ),
  listTaskTemplatesForRoomType: jest.fn(),
  listTaskTemplateItemsForTemplate: jest.fn(),
} ) );

function template( id: string, title: string ) {
  return { id, title, recurrenceType: "INTERVAL", intervalValue: 1, intervalUnit: "WEEK", months: null };
}

describe( "useRoomStore.addRoom 기본 집안일", () => {
  beforeEach( () => {
    jest.clearAllMocks();
    useRoomStore.getState().reset();
    mockRoomCreate.mockResolvedValue( { data: { id: "r1" }, errors: undefined } );
    mockTaskCreate.mockImplementation( input =>
      Promise.resolve( { data: { id: `t-${input.title}` }, errors: undefined } ),
    );
    ( listTaskTemplatesForRoomType as jest.Mock ).mockResolvedValue( [
      template( "a", "설거지" ),
      template( "b", "냉장고 정리" ),
      template( "c", "가스레인지 닦기" ),
    ] );
    ( listTaskTemplateItemsForTemplate as jest.Mock ).mockResolvedValue( [] );
  } );

  test( "templateIds가 없으면 그 방 종류의 템플릿을 모두 만든다", async () => {
    await expect( useRoomStore.getState().addRoom( "f1", "KITCHEN" ) ).resolves.toBe( true );
    expect( mockTaskCreate ).toHaveBeenCalledTimes( 3 );
  } );

  test( "templateIds가 있으면 그 템플릿만 만든다", async () => {
    await useRoomStore.getState().addRoom( "f1", "KITCHEN", undefined, undefined, {
      templateIds: ["a", "c"],
    } );
    expect( mockTaskCreate.mock.calls.map( ( [input] ) => input.title ) ).toEqual( [
      "설거지",
      "가스레인지 닦기",
    ] );
  } );

  test( "빈 templateIds면 집안일을 만들지 않는다", async () => {
    await useRoomStore.getState().addRoom( "f1", "KITCHEN", undefined, undefined, { templateIds: [] } );
    expect( mockTaskCreate ).not.toHaveBeenCalled();
  } );
} );
