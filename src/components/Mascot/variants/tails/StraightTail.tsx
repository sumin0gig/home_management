import React from "react";
import Animated from "react-native-reanimated";
import { Rect } from "react-native-svg";
import type { Pivot, TailVariantProps } from "../../types";

const AnimatedRect = Animated.createAnimatedComponent( Rect );

export const pivot: Pivot = { x: 0, y: 15 };

const StraightTail = ({
  fill,
  animatedProps,
}: TailVariantProps): React.JSX.Element => {
  return (
    <AnimatedRect
      x={ 0 }
      y={ 8 }
      width={ 44 }
      height={ 14 }
      rx={ 7 }
      fill={ fill }
      { ...(animatedProps && { animatedProps }) }
    />
  );
};

export default StraightTail;
