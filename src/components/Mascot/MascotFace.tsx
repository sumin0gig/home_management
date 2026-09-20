import React from "react";
import Svg from "react-native-svg";
import { colors } from "../../styles/commonStyle";
import MascotHead from "./MascotHead";
import type { MascotConfig } from "./types";

// 머리 그룹(원점 = 얼굴 중심)에서 귀 윗끝(-63)부터 얼굴 아랫끝(+40)까지를
// 감싸는 영역. 몸통/다리/꼬리는 그리지 않는다.
const VIEW_BOX = { x: -44, y: -66, width: 88, height: 108 };

interface Props {
  config: MascotConfig;
  size?: number;
}

// 마스코트의 얼굴(귀 + 눈)만 정지 상태로 그린다. 평면도 핀처럼 작은 곳에서
// 전신(Mascot) 대신 쓰는 용도라 애니메이션은 없다. size는 가로 폭.
function MascotFace( { config, size = 40 }: Props ): React.JSX.Element {
  const viewBox = `${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`;

  return (
    <Svg
      width={ size }
      height={ size * (VIEW_BOX.height / VIEW_BOX.width) }
      viewBox={ viewBox }
    >
      <MascotHead
        fill={ config.fillColor ?? colors.yellow }
        earStyle={ config.earStyle }
      />
    </Svg>
  );
}

export default MascotFace;
