import { HOUSE_PRESETS, HOUSE_PRESET_KEYS } from "../../src/store/housePresets";
import { GRID_COLUMNS, isRoomOverlapping } from "../../src/store/useRoomStore";

describe( "HOUSE_PRESETS", () => {
  test.each( HOUSE_PRESET_KEYS )( "%s: 모든 방이 10칸 안에 있고 서로 겹치지 않는다", key => {
    const { rooms } = HOUSE_PRESETS[key];
    rooms.forEach( room => {
      expect( room.x ).toBeGreaterThanOrEqual( 0 );
      expect( room.y ).toBeGreaterThanOrEqual( 0 );
      expect( room.x + room.width ).toBeLessThanOrEqual( GRID_COLUMNS );
    } );
    rooms.forEach( ( a, i ) =>
      rooms.slice( i + 1 ).forEach( b => expect( isRoomOverlapping( a, b ) ).toBe( false ) ),
    );
  } );
} );
