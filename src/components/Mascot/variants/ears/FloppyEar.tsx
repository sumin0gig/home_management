import React from "react";
import Animated from "react-native-reanimated";
import { Path } from "react-native-svg";
import type { EarVariantProps, Pivot } from "../../types";

const AnimatedPath = Animated.createAnimatedComponent( Path );

export const pivot: Pivot = { x: 17, y: 44 };

const FloppyEar = ({
  fill,
  animatedProps,
}: EarVariantProps): React.JSX.Element => {
  return (
    <AnimatedPath
      d="M17,44 C4,42 2,22 9,8 C15,0 27,3 30,15 C33,27 28,40 17,44 Z"
      fill={ fill }
      animatedProps={ animatedProps }
    />
  );
};

export default FloppyEar;
