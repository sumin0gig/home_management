import React from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GRID_COLUMNS, type FloorPlanRoom } from "../../store/useRoomStore";
import { colors, commonColor } from "../../styles/commonStyle";
import DraggableRoomBlock from "./DraggableRoomBlock";

const MIN_GRID_ROWS = 6;
const CANVAS_BOTTOM_PADDING_ROWS = 1;

interface Props {
  rooms: FloorPlanRoom[];
  editable?: boolean;
  removable?: boolean;
  onRoomPress?: (room: FloorPlanRoom) => void;
  onRoomMove?: (roomId: string, x: number, y: number) => void;
  hasDueToday?: (room: FloorPlanRoom) => boolean;
  mascotRoomId?: string | null;
}

function FloorPlanCanvas( {
  rooms,
  editable = false,
  removable = false,
  onRoomPress,
  onRoomMove,
  hasDueToday,
  mascotRoomId,
}: Props ): React.JSX.Element {
  const [containerWidth, setContainerWidth] = React.useState( 0 );
  const cellSize = containerWidth / GRID_COLUMNS;

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth( e.nativeEvent.layout.width );
  };

  const usedRows =
    rooms.length === 0
      ? 0
      : Math.max( ...rooms.map( room => room.y + room.height ) );
  const gridRows =
    Math.max( usedRows, MIN_GRID_ROWS ) + CANVAS_BOTTOM_PADDING_ROWS;
  const canvasHeight = gridRows * cellSize;

  if( containerWidth === 0 ) {
    return (
      <View
        testID="floor-plan-canvas"
        onLayout={ onLayout }
        style={ [styles.canvas, { height: canvasHeight }] }
      />
    );
  }

  return (
    <View
      testID="floor-plan-canvas"
      onLayout={ onLayout }
      style={ [styles.canvas, { height: canvasHeight }] }
    >
      { Array.from( { length: GRID_COLUMNS + 1 } ).map( (_, index) => (
        <View
          key={ `col-${index}` }
          style={ [styles.columnLine, { left: index * cellSize }] }
        />
      ) ) }
      { Array.from( { length: gridRows + 1 } ).map( (_, index) => (
        <View
          key={ `row-${index}` }
          style={ [styles.rowLine, { top: index * cellSize }] }
        />
      ) ) }
      {
        rooms.map( room => (
          <DraggableRoomBlock
            key={ room.id }
            room={ room }
            rooms={ rooms }
            cellSize={ cellSize }
            editable={ editable }
            onPress={ onRoomPress ? () => onRoomPress( room ) : undefined }
            onMove={
              onRoomMove ? (x, y) => onRoomMove( room.id, x, y ) : undefined
            }
            hasDueToday={ hasDueToday ? hasDueToday( room ) : false }
            hasMascot={ room.id === mascotRoomId }
            isRemovable={ removable }
          />
        ) )
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  canvas: {
    borderWidth: 1,
    borderColor: commonColor.divider,
    borderRadius: 12,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  columnLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: commonColor.divider,
  },
  rowLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: commonColor.divider,
  },
} );

export default FloorPlanCanvas;
