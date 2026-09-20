import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../styles/commonStyle";
import MascotFace from "./MascotFace";
import { useMascotConfig } from "./useMascotConfig";

const PIN_SIZE = 44;
const FACE_WIDTH = 28;
const TAIL_SIZE = 10;

interface Props {
  testID?: string;
}

// 평면도에서 "마스코트가 이 방에 있다"를 알리는 핀 — 흰 원 안에 마스코트
// 얼굴, 아래쪽에 뾰족한 꼬리. 마스코트 설정은 직접 store에서 읽고, 마스코트가
// 아직 없으면 아무것도 그리지 않는다.
function MascotPin( { testID }: Props ): React.JSX.Element | null {
  const config = useMascotConfig();

  if (!config) {
    return null;
  }

  return (
    <View style={ styles.pin } testID={ testID }>
      <View style={ styles.circle }>
        <MascotFace config={ config } size={ FACE_WIDTH } />
      </View>
      <View style={ styles.tail } />
    </View>
  );
}

const styles = StyleSheet.create( {
  pin: {
    alignItems: "center",
  },
  circle: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: colors.pureBlack,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tail: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: TAIL_SIZE / 2,
    borderRightWidth: TAIL_SIZE / 2,
    borderTopWidth: TAIL_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.white,
  },
} );

export default MascotPin;
