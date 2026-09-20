import React from "react";
import { G } from "react-native-svg";
import { colors } from "../../styles/commonStyle";
import AnimatedG from "./parts/AnimatedG";
import Eye from "./parts/Eye";
import Face from "./parts/Face";
import type { EarVariant, VariantAnimatedProps } from "./types";
import { EAR_PIVOTS, EAR_VARIANTS } from "./variants/ears";

// 머리 그룹의 원점은 얼굴 중심이다. 아래 좌표는 모두 그 원점 기준.
const EAR_BOX ={ width: 34, height: 46 };
const EAR_L_ORIGIN = { x: -40, y: -63 };
const EAR_R_ORIGIN = { x: 6, y: -63 };

interface Props {
  fill: string;
  earStyle: EarVariant;
  // 전신(Mascot)은 귀/눈 애니메이션을 넘기고, 얼굴만 그리는 곳(MascotFace)은
  // 넘기지 않는다. 값이 없을 때는 animatedProps 키 자체를 빼야 한다 —
  // reanimated가 키가 있으면 .initial을 읽다가 undefined에서 죽는다.
  earLAnimatedProps?: VariantAnimatedProps;
  earRAnimatedProps?: VariantAnimatedProps;
  eyeLAnimatedProps?: VariantAnimatedProps;
  eyeRAnimatedProps?: VariantAnimatedProps;
}

// 얼굴 원 + 귀 2개 + 눈 2개. Mascot(전신)과 MascotFace(얼굴만)가 공유한다.
function MascotHead( {
  fill,
  earStyle,
  earLAnimatedProps,
  earRAnimatedProps,
  eyeLAnimatedProps,
  eyeRAnimatedProps,
}: Props ): React.JSX.Element {
  const EarComponent = EAR_VARIANTS[earStyle];
  const earPivot = EAR_PIVOTS[earStyle];

  return (
    <>
      <Face fill={ fill } />
      <G x={ EAR_L_ORIGIN.x } y={ EAR_L_ORIGIN.y }>
        <AnimatedG
          origin={ `${earPivot.x}, ${earPivot.y}` }
          { ...(earLAnimatedProps && { animatedProps: earLAnimatedProps }) }
        >
          <EarComponent
            width={ EAR_BOX.width }
            height={ EAR_BOX.height }
            fill={ fill }
          />
        </AnimatedG>
      </G>
      { /* Mirrored horizontally so an asymmetric ear shape (e.g. the
          floppy variant, which flares outward to one side) droops
          away from the head on both sides instead of both ears
          flaring the same absolute direction. A no-op for the
          left-right-symmetric round/pointy shapes. */ }
      <G
        transform={ `translate(${EAR_BOX.width + EAR_R_ORIGIN.x}, ${EAR_R_ORIGIN.y}) scale(-1, 1)` }
      >
        <AnimatedG
          origin={ `${earPivot.x}, ${earPivot.y}` }
          { ...(earRAnimatedProps && { animatedProps: earRAnimatedProps }) }
        >
          <EarComponent
            width={ EAR_BOX.width }
            height={ EAR_BOX.height }
            fill={ fill }
          />
        </AnimatedG>
      </G>
      <Eye
        cx={ -15 }
        cy={ -3 }
        fill={ colors.black }
        animatedProps={ eyeLAnimatedProps }
      />
      <Eye
        cx={ 15 }
        cy={ -3 }
        fill={ colors.black }
        animatedProps={ eyeRAnimatedProps }
      />
    </>
  );
}

export default MascotHead;
