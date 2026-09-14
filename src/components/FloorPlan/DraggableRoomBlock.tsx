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
  hasDueToday?: boolean;
}

function DraggableRoomBlock( {
  room,
  rooms,
  cellSize,
  editable,
  onPress,
  onMove,
  hasDueToday,
}: Props ): React.JSX.Element {
  const translateX = useSharedValue( 0 );
  const translateY = useSharedValue( 0 );

  // room.x/y가 서버 반영 후 갱신되는 시점에 맞춰 오프셋을 0으로 되돌린다 —
  // 그 전에 미리 0으로 리셋하면 새 좌표가 반영되기 전까지 한 프레임 동안
  // 원래 자리로 되돌아갔다가 다시 이동하는 것처럼 보인다.
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

    // 목표 위치의 픽셀 오프셋으로 우선 이동시켜두고, 부모가 onMove로 받은
    // 좌표를 반영해 room.x/y prop이 갱신되면 위 useEffect가 오프셋을 0으로
    // 정리한다(그 사이 화면 위치는 동일하게 유지됨). DB 저장은 여기서 하지
    // 않고, 부모(RoomEditScreen)가 별도 저장 버튼을 누를 때 한꺼번에 한다.
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

  const tapGesture = Gesture.Tap().onEnd( () => {
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
        hasDueToday
        ? <View style={ styles.dueBadge } testID={ `due-badge-${room.id}` } />
        : null
      }
      <Text style={ styles.label } numberOfLines={ 1 }>
        { roomDisplayName( room ) }
      </Text>
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
  dueBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: commonColor.negative,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
} );

export default DraggableRoomBlock;
