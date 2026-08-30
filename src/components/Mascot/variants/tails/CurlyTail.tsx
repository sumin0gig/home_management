import React from "react";
import Animated from "react-native-reanimated";
import { Path } from "react-native-svg";
import type { Pivot, TailVariantProps } from "../../types";

const AnimatedPath = Animated.createAnimatedComponent( Path );

export const pivot: Pivot = { x: 0, y: 15 };

const CurlyTail = ({
  fill,
  animatedProps,
}: TailVariantProps): React.JSX.Element => {
  return (
    <AnimatedPath
      d="M0,10 C10,-5 35,-5 40,15 C43,28 30,35 20,25 C15,20 20,15 25,18 C22,22 12,20 8,14 Z"
      fill={ fill }
      { ...(animatedProps && { animatedProps }) }
    />
  );
};

export default CurlyTail;
