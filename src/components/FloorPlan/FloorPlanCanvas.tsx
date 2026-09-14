import React from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { GRID_COLUMNS, type FloorPlanRoom } from "../../store/useRoomStore";
import { colors, commonColor } from "../../styles/commonStyle";
import DraggableRoomBlock from "./DraggableRoomBlock";

const HORIZONTAL_PADDING = 16;
const MIN_GRID_ROWS = 6;
const CANVAS_BOTTOM_PADDING_ROWS = 1;

interface Props {
  rooms: FloorPlanRoom[];
  editable?: boolean;
  onRoomPress?: (room: FloorPlanRoom) => void;
  onRoomMove?: (roomId: string, x: number, y: number) => void;
  hasDueToday?: (room: FloorPlanRoom) => boolean;
}

function FloorPlanCanvas( {
  rooms,
  editable = false,
  onRoomPress,
  onRoomMove,
  hasDueToday,
}: Props ): React.JSX.Element {
  const { width: windowWidth } = useWindowDimensions();
  const cellSize = (windowWidth - HORIZONTAL_PADDING * 2) / GRID_COLUMNS;

  const usedRows =
    rooms.length === 0
      ? 0
      : Math.max( ...rooms.map( room => room.y + room.height ) );
  const gridRows =
    Math.max( usedRows, MIN_GRID_ROWS ) + CANVAS_BOTTOM_PADDING_ROWS;
  const canvasHeight = gridRows * cellSize;

  return (
    <View style={ [styles.canvas, { height: canvasHeight }] }>
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
      { rooms.map( room => (
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
        />
      ) ) }
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
