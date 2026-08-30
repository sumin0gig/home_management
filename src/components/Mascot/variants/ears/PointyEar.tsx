import React from "react";
import Animated from "react-native-reanimated";
import { Path } from "react-native-svg";
import type { EarVariantProps, Pivot } from "../../types";

const AnimatedPath = Animated.createAnimatedComponent( Path );

export const pivot: Pivot = { x: 17, y: 44 };

const PointyEar = ({
  fill,
  animatedProps,
}: EarVariantProps): React.JSX.Element => {
  return (
    <AnimatedPath
      d="M4,44 L17,4 L30,44 Q17,50 4,44 Z"
      fill={ fill }
      { ...(animatedProps && { animatedProps }) }
    />
  );
};

export default PointyEar;
