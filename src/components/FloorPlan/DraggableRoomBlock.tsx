import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  GRID_COLUMNS,
  isRoomOverlapping,
  roomDisplayName,
  type FloorPlanRoom,
} from "../../store/useRoomStore";
import { colors, commonColor } from "../../styles/commonStyle";
import MascotPin from "../Mascot/MascotPin";

// 색상을 아직 저장하지 못한(레거시) row를 만났을 때만 쓰는 방어적 기본값 —
// 평소엔 room.color가 생성 시점에 항상 채워져서 쓸 일이 없다.
const FALLBACK_ROOM_COLOR = colors.gray;

interface Props {
  room: FloorPlanRoom;
  rooms: FloorPlanRoom[];
  cellSize: number;
  editable: boolean;
  onPress?: () => void;
  onMove?: (x: number, y: number) => void;
  // 기한이 오늘이거나 지난 일의 개수. 0이면 배지를 그리지 않는다.
  dueCount?: number;
  hasMascot?: boolean;
}

function DraggableRoomBlock( {
  room,
  rooms,
  cellSize,
  editable,
  onPress,
  onMove,
  dueCount = 0,
  hasMascot,
}: Props ): React.JSX.Element {
  const translateX = useSharedValue( 0 );
  const translateY = useSharedValue( 0 );

  React.useEffect( () => {
    translateX.value = 0;
    translateY.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.x, room.y] );

  const handleDragEnd = (translationX: number, translationY: number) => {
    const deltaX = Math.round( translationX / cellSize );
    const deltaY = Math.round( translationY / cellSize );
    const maxX = GRID_COLUMNS - room.width;
    const nextX = Math.min( Math.max( room.x + deltaX, 0 ), maxX );
    const nextY = Math.max( room.y + deltaY, 0 );

    const candidate = {
      x: nextX,
      y: nextY,
      width: room.width,
      height: room.height,
    };
    const overlaps = rooms.some(
      other => other.id !== room.id && isRoomOverlapping( candidate, other ),
    );

    if (overlaps) {
      translateX.value = withTiming( 0 );
      translateY.value = withTiming( 0 );
      return;
    }

    translateX.value = (nextX - room.x) * cellSize;
    translateY.value = (nextY - room.y) * cellSize;
    onMove?.( nextX, nextY );
  };

  const panGesture = Gesture.Pan()
  .onUpdate( event => {
    translateX.value = event.translationX;
    translateY.value = event.translationY;
  } )
  .onEnd( event => {
    runOnJS( handleDragEnd )( event.translationX, event.translationY );
  } );

  const tapGesture = Gesture.Tap()
  .onEnd( () => {
    if (onPress) {
      runOnJS( onPress )();
    }
  } );

  const gesture = Gesture.Race( tapGesture, panGesture );

  const animatedStyle = useAnimatedStyle( () => ( {
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  } ) );

  const boxStyle = {
    left: room.x * cellSize,
    top: room.y * cellSize,
    width: room.width * cellSize,
    height: room.height * cellSize,
    backgroundColor: room.color ?? FALLBACK_ROOM_COLOR,
  };

  const content = (
    <>
      {
        dueCount > 0
        ? <View
            style={ styles.dueBadge }
            testID={ `due-badge-${room.id}` }
            pointerEvents="none"
          >
            <Text style={ styles.dueBadgeText }> { dueCount } </Text>
          </View>
        : null
      }
      <Text style={ styles.label } numberOfLines={ 1 }>
        { roomDisplayName( room ) }
      </Text>
      {
        hasMascot
        ? <View style={ styles.mascotPin } pointerEvents="none">
          <MascotPin testID={ `mascot-pin-${room.id}` } />
        </View>
        : null
      }
    </>
  );

  if (!editable) {
    return (
      <Pressable style={ [styles.block, boxStyle] } onPress={ onPress }>
        { content }
      </Pressable>
    );
  }

  return (
    <GestureDetector gesture={ gesture }>
      <Animated.View style={ [styles.block, boxStyle, animatedStyle] }>
        { content }
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create( {
  block: {
    position: "absolute",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: commonColor.subtleBorder,
  },
  // 방 이름(왼쪽 위)·마스코트(가운데)와 겹치지 않게 오른쪽 아래
  dueBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    height: 16,
    minWidth: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: commonColor.textDefault,
  },
  dueBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: colors.white,
  },
  mascotPin: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
} );

export default DraggableRoomBlock;
