import React from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { type FloorPlanRoom } from "../../store/useRoomStore";
import { colors, commonColor } from "../../styles/commonStyle";
import WanderingMascot from "../Mascot/WanderingMascot";
import { useMascotConfig } from "../Mascot/useMascotConfig";

// 방 안에서는 마스코트를 평면도 위 핀보다 작게 그린다.
const INTERIOR_MASCOT_SIZE = 64;

interface Props {
  room: FloorPlanRoom;
  hasMascot?: boolean;
  onMascotPress?: () => void;
}

// 방 상세 화면에서 할일 목록 위에 보여주는 방 내부 패널. 지금은 방 색상과
// 가로:세로 비율만 반영한 단순 패널이고, 마스코트가 이 방에 있을 때만
// 패널 안에서 돌아다닌다.
function RoomInterior( {
  room,
  hasMascot,
  onMascotPress,
}: Props ): React.JSX.Element {
  const mascotConfig = useMascotConfig();
  const [bounds, setBounds] = React.useState( { width: 0, height: 0 } );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBounds( { width, height } );
  };

  return (
    <View
      style={ [
        styles.panel,
        {
          aspectRatio: room.width / room.height,
          backgroundColor: room.color ?? colors.gray,
        },
      ] }
      onLayout={ onLayout }
    >
      {
        hasMascot && mascotConfig
        ? <WanderingMascot
          config={ mascotConfig }
          bounds={ bounds }
          size={ INTERIOR_MASCOT_SIZE }
          onPress={ onMascotPress }
        />
        : null
      }
    </View>
  );
}

const styles = StyleSheet.create( {
  panel: {
    width: "100%",
    maxHeight: 240,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    alignSelf: "center",
  },
} );

export default RoomInterior;
