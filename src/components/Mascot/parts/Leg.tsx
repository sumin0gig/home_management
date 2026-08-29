import React from "react";
import Animated from "react-native-reanimated";
import { Rect } from "react-native-svg";
import type { VariantAnimatedProps } from "../types";

const AnimatedRect = Animated.createAnimatedComponent( Rect );

interface Props {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  animatedProps?: VariantAnimatedProps;
}

const Leg = ({
  x,
  y,
  width,
  height,
  fill,
  animatedProps,
}: Props): React.JSX.Element => {
  return (
    <AnimatedRect
      x={ x }
      y={ y }
      width={ width }
      height={ height }
      rx={ width / 2 }
      fill={ fill }
      animatedProps={ animatedProps }
    />
  );
};

export default Leg;
